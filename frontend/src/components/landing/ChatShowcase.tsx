'use client';

import { motion } from 'framer-motion';
import { Sparkles, Bot, User, Send, Paperclip, Mic, Terminal, FileText, CheckCircle2, Shield } from 'lucide-react';

export default function ChatShowcase() {
  return (
    <section className="py-12 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl glass-panel border border-brand-500/20 shadow-2xl shadow-brand-950/50 overflow-hidden"
        >
          {/* Header Bar */}
          <div className="bg-[#0e0e17] px-6 py-4 border-b border-surface-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              </div>
              <div className="h-4 w-[1px] bg-surface-border mx-1" />
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>SurajAI Workspace v1.0</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Gemini 1.5 Pro (Active)
              </span>
            </div>
          </div>

          {/* Chat Window */}
          <div className="p-6 sm:p-8 space-y-6 bg-[#07070c]/90 min-h-[420px]">
            {/* User Message */}
            <div className="flex gap-4 max-w-3xl ml-auto justify-end">
              <div className="bg-brand-600/90 text-white p-4 rounded-2xl rounded-tr-sm shadow-md text-sm sm:text-base leading-relaxed">
                Analyze our financial report PDF, check memory for our quarterly KPI target, and format the key variance metrics.
              </div>
              <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center shrink-0 border border-surface-border text-gray-300">
                <User className="w-5 h-5" />
              </div>
            </div>

            {/* Tool Activity Indicator */}
            <div className="flex items-center gap-3 text-xs text-brand-300 bg-brand-950/40 border border-brand-500/30 px-4 py-2.5 rounded-xl max-w-lg">
              <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" />
                <span>RAG Retrieval: Extracted 4 relevant chunks from <strong>Q3_Report.pdf</strong></span>
              </div>
            </div>

            {/* Assistant Response */}
            <div className="flex gap-4 max-w-3xl">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="glass-card p-5 rounded-2xl rounded-tl-sm text-sm sm:text-base text-gray-200 space-y-4">
                <p>
                  Based on <strong>Q3_Report.pdf</strong> and your saved AI memory preference (Target Revenue: <strong>$4.2M</strong>), here is your quarterly variance breakdown:
                </p>

                <div className="rounded-xl border border-surface-border overflow-hidden bg-[#0d0d14]">
                  <table className="w-full text-xs sm:text-sm text-left">
                    <thead className="bg-surface-hover text-gray-400 border-b border-surface-border">
                      <tr>
                        <th className="p-3">Metric</th>
                        <th className="p-3">Q3 Actual</th>
                        <th className="p-3">Memory Target</th>
                        <th className="p-3">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-gray-300">
                      <tr>
                        <td className="p-3 font-medium text-white">ARR Growth</td>
                        <td className="p-3">$4.45M</td>
                        <td className="p-3">$4.20M</td>
                        <td className="p-3 text-green-400 font-medium">+5.95%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium text-white">Gross Margin</td>
                        <td className="p-3">86.2%</td>
                        <td className="p-3">85.0%</td>
                        <td className="p-3 text-green-400 font-medium">+1.20%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400 pt-2 border-t border-surface-border/50">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span>Memory updated: Preferences noted for automated Q4 projections.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Composer Footer */}
          <div className="p-4 bg-[#0c0c14] border-t border-surface-border flex items-center gap-3">
            <button className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              readOnly
              value="Ask SurajAI anything..."
              className="flex-1 bg-surface-dark border border-surface-border rounded-xl px-4 py-3 text-sm text-gray-400 focus:outline-none cursor-default"
            />
            <button className="p-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-surface-hover transition-colors">
              <Mic className="w-5 h-5" />
            </button>
            <button className="p-3 rounded-xl bg-brand-600 text-white hover:bg-brand-500 shadow-md shadow-brand-600/30 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
