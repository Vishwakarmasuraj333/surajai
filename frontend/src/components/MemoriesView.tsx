'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import {
  Brain,
  Plus,
  Search,
  Trash2,
  Edit3,
  Archive,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';

interface MemoryItem {
  id: string;
  content: string;
  type: string;
  category: string;
  importance: number;
  createdAt: string;
  lastUsedAt?: string;
}

export default function MemoriesView() {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [rememberMemory, setRememberMemory] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('FACT');
  const [newImportance, setNewImportance] = useState(5);

  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => Promise<void>;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Delete',
    onConfirm: async () => {},
    isLoading: false,
  });

  const loadMemories = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/memories');
      if (res.memories) {
        setMemories(res.memories);
      }
      if (res.rememberMemory !== undefined) {
        setRememberMemory(res.rememberMemory);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMemories();
  }, []);

  const handleToggleMemory = async () => {
    const nextVal = !rememberMemory;
    setRememberMemory(nextVal);
    try {
      await fetchWithAuth('/api/memories/setting', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rememberMemory: nextVal }),
      });
    } catch (err) {
      setRememberMemory(!nextVal);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    try {
      const res = await fetchWithAuth('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          type: newType,
          importance: newImportance,
        }),
      });

      if (res.memory) {
        setMemories([res.memory, ...memories]);
        setNewContent('');
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = (id: string, contentSnippet: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete AI Memory',
      message: `Are you sure you want to delete this memory snippet: "${contentSnippet.slice(0, 60)}${contentSnippet.length > 60 ? '...' : ''}"?`,
      confirmText: 'Delete Memory',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await fetchWithAuth(`/api/memories/${id}`, { method: 'DELETE' });
          setMemories((prev) => prev.filter((m) => m.id !== id));
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleClearAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Clear All Persistent Memories',
      message: 'Are you sure you want to delete ALL persistent memories? SurajAI will forget all saved preferences and context. This action cannot be undone.',
      confirmText: 'Clear All Memories',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await fetchWithAuth('/api/memories', { method: 'DELETE' });
          setMemories([]);
        } catch (err) {
          console.error(err);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const filteredMemories = memories.filter((m) =>
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-200/80 dark:border-purple-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-purple-950 dark:text-purple-300">
            <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" /> Persistent AI Memory
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            SurajAI remembers long-term facts, preferences, goals, and project details to personalize every response.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleToggleMemory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-purple-500/30 text-sm font-semibold text-slate-800 dark:text-slate-200 hover:border-purple-400 transition-all shadow-sm"
          >
            {rememberMemory ? (
              <>
                <ToggleRight className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                <span>Memory Enabled</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                <span>Memory Disabled</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all shadow-md shadow-purple-900/30"
          >
            <Plus className="w-4 h-4" /> Add Memory
          </button>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950/60 border border-amber-200/80 dark:border-purple-500/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm shadow-sm"
          />
        </div>

        {memories.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Memories
          </button>
        )}
      </div>

      {/* Memory Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-600 dark:text-slate-400 text-sm">Loading memories...</div>
      ) : filteredMemories.length === 0 ? (
        <div className="p-12 text-center text-slate-600 dark:text-slate-400 space-y-2 border border-amber-200/80 dark:border-purple-500/20 rounded-2xl bg-white dark:bg-slate-900/40 shadow-sm">
          <Brain className="w-10 h-10 mx-auto text-purple-600/50 dark:text-purple-400/50" />
          <p className="text-base font-semibold text-slate-900 dark:text-slate-300">No memories found</p>
          <p className="text-xs text-slate-500">As you chat with SurajAI, important preferences and context will automatically be saved here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMemories.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-amber-200/80 dark:border-purple-500/20 backdrop-blur-md flex flex-col justify-between gap-3 hover:border-purple-400 transition-all shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30 uppercase tracking-wider">
                    {m.type || 'FACT'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Importance: {m.importance}/10</span>
                </div>
                <p className="text-sm text-slate-900 dark:text-slate-200 leading-relaxed font-semibold">"{m.content}"</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-amber-200/60 dark:border-purple-500/10">
                <span>Added {new Date(m.createdAt).toLocaleDateString()}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(m.id, m.content)}
                  aria-label="Delete memory"
                  className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={confirmModal.isLoading}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      {/* Manual Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100">Add Custom Memory</h3>
            <form onSubmit={handleCreateMemory} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Memory Content</label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="e.g. User prefers concise TypeScript code snippets with minimal comments."
                  className="w-full p-3 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Memory Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-200 text-sm"
                  >
                    <option value="PREFERENCE">Preference</option>
                    <option value="FACT">Fact</option>
                    <option value="GOAL">Goal</option>
                    <option value="PROJECT">Project</option>
                    <option value="INSTRUCTION">Instruction</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Importance (1-10)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newImportance}
                    onChange={(e) => setNewImportance(parseInt(e.target.value, 10))}
                    className="w-full p-2.5 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/30"
                >
                  Save Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
