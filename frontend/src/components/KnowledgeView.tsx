'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import {
  BookOpen,
  UploadCloud,
  FileText,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive
} from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';

interface DocumentItem {
  id: string;
  name: string;
  fileSize: number;
  mimeType: string;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  chunkCount: number;
  tokenCount: number;
  errorMessage?: string;
  createdAt: string;
}

export default function KnowledgeView() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/documents');
      if (res.documents) {
        setDocuments(res.documents);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);

      await fetchWithAuth('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string, docName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete RAG Document',
      message: `Are you sure you want to delete "${docName}" from your Knowledge Base? Vector embeddings for this file will be permanently removed.`,
      confirmText: 'Delete Document',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await fetchWithAuth(`/api/documents/${id}`, { method: 'DELETE' });
          setDocuments((prev) => prev.filter((d) => d.id !== id));
        } catch (err: any) {
          setError(err.message || 'Deletion failed');
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const filteredDocs = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-200/80 dark:border-purple-500/20 pb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-purple-950 dark:text-purple-300">
            <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" /> RAG Knowledge Base
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Upload PDFs, DOCX, TXT, Markdown, CSV, or JSON documents. SurajAI embeds and searches them dynamically during conversations.
          </p>
        </div>
        <label className="cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all">
          <UploadCloud className="w-5 h-5" />
          {uploading ? 'Uploading & Embedding...' : 'Upload Document'}
          <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.docx,.txt,.md,.csv,.json" disabled={uploading} />
        </label>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-100 dark:bg-red-950/50 border border-red-300 dark:border-red-500/30 text-red-800 dark:text-red-300 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" /> {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-amber-200/80 dark:border-purple-500/20 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{documents.length}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Total Documents</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-amber-200/80 dark:border-purple-500/20 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {documents.reduce((acc, d) => acc + (d.chunkCount || 0), 0)}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Embedded Chunks</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-amber-200/80 dark:border-purple-500/20 backdrop-blur-md flex items-center gap-4 shadow-sm">
          <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {documents.filter((d) => d.status === 'READY').length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Ready for Search</div>
          </div>
        </div>
      </div>

      {/* Search & Document List Table */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search documents by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-950/60 border border-amber-200/80 dark:border-purple-500/20 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm shadow-sm"
          />
        </div>

        <div className="rounded-2xl border border-amber-200/80 dark:border-purple-500/20 bg-white dark:bg-slate-900/40 backdrop-blur-md overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400 text-sm">Loading knowledge base...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center text-slate-600 dark:text-slate-400 space-y-2">
              <BookOpen className="w-10 h-10 mx-auto text-purple-600/50 dark:text-purple-400/50" />
              <p className="text-base font-semibold text-slate-900 dark:text-slate-300">No documents found</p>
              <p className="text-xs text-slate-500">Upload your PDF or text files above to start semantic RAG retrieval.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-amber-200/80 dark:border-purple-500/20 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-400 font-semibold">
                  <th className="p-4">Document</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Chunks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/60 dark:divide-purple-500/10">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-purple-50/60 dark:hover:bg-purple-950/10 transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-slate-200 flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="truncate max-w-xs">{doc.name}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">{formatSize(doc.fileSize)}</td>
                    <td className="p-4">
                      {doc.status === 'READY' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5" /> Ready
                        </span>
                      )}
                      {doc.status === 'PROCESSING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> Processing
                        </span>
                      )}
                      {doc.status === 'FAILED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-400 border border-red-300 dark:border-red-500/30" title={doc.errorMessage}>
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">{doc.chunkCount || 0}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id, doc.name)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete document"
                        aria-label={`Delete document ${doc.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={confirmModal.isLoading}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />
    </div>
  );
}
