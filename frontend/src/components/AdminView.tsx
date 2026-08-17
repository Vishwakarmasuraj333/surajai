'use client';

import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/lib/api';
import {
  ShieldAlert,
  Users,
  MessageSquare,
  Cpu,
  Brain,
  FileText,
  Activity,
  Search,
  Clock
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalConversations: number;
  totalMessages: number;
  totalMemories: number;
  totalDocuments: number;
  totalTokens: number;
  avgLatencyMs: number;
  totalAIRequests: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  _count: {
    conversations: number;
    memories: number;
    documents: number;
  };
}

export default function AdminView() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        setLoading(true);
        const [overviewRes, usersRes] = await Promise.all([
          fetchWithAuth('/api/admin/overview'),
          fetchWithAuth('/api/admin/users'),
        ]);

        if (overviewRes.stats) {
          setStats(overviewRes.stats);
        }
        if (usersRes.users) {
          setUsers(usersRes.users);
        }
      } catch (err: any) {
        setError(err.message || 'Access denied or admin loading failed');
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto overflow-y-auto space-y-6 text-slate-100">
      <div className="border-b border-purple-500/20 pb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-amber-400">
          <ShieldAlert className="w-6 h-6 text-amber-400" /> Admin Analytics Dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">Platform overview, system user accounts, and AI token metrics.</p>
      </div>

      {error ? (
        <div className="p-6 rounded-2xl bg-red-950/60 border border-red-500/30 text-red-300 text-center space-y-2">
          <ShieldAlert className="w-10 h-10 mx-auto text-red-400" />
          <p className="text-base font-bold">{error}</p>
          <p className="text-xs text-red-400/80">You must have the ADMIN role in MySQL database to access this panel.</p>
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-slate-400">Loading platform metrics...</div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Users</span>
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{stats?.totalUsers || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Conversations</span>
                <MessageSquare className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{stats?.totalConversations || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Tokens Consumed</span>
                <Cpu className="w-4 h-4 text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{stats?.totalTokens.toLocaleString() || 0}</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/20 backdrop-blur-md space-y-1">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Avg Latency</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-slate-100">{stats?.avgLatencyMs || 0} ms</div>
            </div>
          </div>

          {/* User Management */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-200">Registered Users</h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-purple-500/20 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-purple-500/20 bg-slate-900/40 backdrop-blur-md overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-purple-500/20 bg-slate-950/40 text-slate-400 font-medium">
                    <th className="p-3">User</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Conversations</th>
                    <th className="p-3">Memories</th>
                    <th className="p-3">Documents</th>
                    <th className="p-3">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-purple-950/10 transition-colors">
                      <td className="p-3 font-medium text-slate-200">
                        <div>{u.name}</div>
                        <div className="text-slate-500 text-[11px]">{u.email}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-300'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3 text-slate-300">{u._count.conversations}</td>
                      <td className="p-3 text-slate-300">{u._count.memories}</td>
                      <td className="p-3 text-slate-300">{u._count.documents}</td>
                      <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
