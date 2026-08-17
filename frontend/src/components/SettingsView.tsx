'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Settings,
  User,
  Cpu,
  Download,
  Trash2,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

import ConfirmModal from '@/components/ConfirmModal';

export default function SettingsView() {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [defaultModel, setDefaultModel] = useState('gemini-1.5-pro');
  const [responseStyle, setResponseStyle] = useState('concise');
  const [rememberMemory, setRememberMemory] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    confirmText: 'Delete Account',
    onConfirm: async () => {},
    isLoading: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await fetchWithAuth('/api/users/settings');
      if (data.settings) {
        setDefaultModel(data.settings.defaultModel || 'gemini-1.5-pro');
        setResponseStyle(data.settings.responseStyle || 'concise');
        setRememberMemory(data.settings.rememberMemory ?? true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await fetchWithAuth('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, defaultModel, responseStyle, rememberMemory }),
      });
      setMessage('Profile settings updated successfully!');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await fetchWithAuth('/api/users/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SurajAI-Export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage(`Error exporting data: ${err.message}`);
    }
  };

  const handleDeleteAccount = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Account',
      message: 'CRITICAL WARNING: Are you sure you want to permanently delete your account? All conversations, messages, memories, and documents will be permanently erased. This action cannot be undone.',
      confirmText: 'Permanently Delete Account',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await fetchWithAuth('/api/users/me', { method: 'DELETE' });
          await logout();
        } catch (err: any) {
          setMessage(`Error deleting account: ${err.message}`);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto overflow-y-auto space-y-8 text-slate-100">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={confirmModal.isLoading}
      />
      <div className="border-b border-purple-500/20 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-purple-300">
          <Settings className="w-6 h-6 text-purple-400" /> Account & AI Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">Manage your profile, model preferences, privacy, and data export.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center gap-2 ${message.startsWith('Error') ? 'bg-red-950/50 border border-red-500/30 text-red-300' : 'bg-emerald-950/50 border border-emerald-500/30 text-emerald-300'}`}>
          {message.startsWith('Error') ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {message}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-400" /> User Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-100 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full p-2.5 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* AI Model Preferences Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-4">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" /> AI Model Preferences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Default AI Model</label>
              <select
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-100 text-sm"
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Recommended)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Response Style</label>
              <select
                value={responseStyle}
                onChange={(e) => setResponseStyle(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-purple-500/20 rounded-xl text-slate-100 text-sm"
              >
                <option value="concise">Concise & Direct</option>
                <option value="detailed">Detailed & Comprehensive</option>
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-900/30 transition-all"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      {/* Data Export & Account Privacy */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" /> Data Privacy & Export
        </h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-purple-500/10">
          <div>
            <div className="text-sm font-medium text-slate-200">Export Personal Data</div>
            <div className="text-xs text-slate-400">Download a complete JSON export of your profile, conversations, memories, and documents.</div>
          </div>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
          >
            <Download className="w-4 h-4" /> Export Data JSON
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-purple-500/10">
          <div>
            <div className="text-sm font-medium text-red-400">Delete Account</div>
            <div className="text-xs text-slate-400">Permanently remove your account and erase all associated data.</div>
          </div>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-500/30 text-sm font-medium rounded-xl flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
