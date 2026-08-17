'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Copy, Check, Edit3, X } from 'lucide-react';

interface TextSelectionToolbarProps {
  onAskSurajAI: (selectedText: string) => void;
  onEditInComposer: (selectedText: string) => void;
}

export default function TextSelectionToolbar({
  onAskSurajAI,
  onEditInComposer,
}: TextSelectionToolbarProps) {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length < 2) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0 && rect.height > 0) {
          setSelectedText(text);
          setPosition({
            top: Math.max(10, rect.top - 50),
            left: Math.min(window.innerWidth - 240, Math.max(10, rect.left + rect.width / 2 - 100)),
          });
        }
      } catch (e) {
        // Selection error guard
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
    };
  }, []);

  if (!position || !selectedText) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(selectedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAsk = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAskSurajAI(selectedText);
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditInComposer(selectedText);
    setPosition(null);
    window.getSelection()?.removeAllRanges();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      className="z-50 animate-in fade-in zoom-in-95 duration-150 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#131526] border border-purple-500/40 text-slate-100 shadow-2xl shadow-purple-950/50 backdrop-blur-md select-none text-xs font-semibold"
    >
      <button
        type="button"
        onClick={handleAsk}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-1.5 shadow-md transition-all active:scale-95"
        title="Ask SurajAI about selected text"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Ask SurajAI</span>
      </button>

      <button
        type="button"
        onClick={handleCopy}
        className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
        title="Copy selected text"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      <button
        type="button"
        onClick={handleEdit}
        className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
        title="Edit text in composer"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        onClick={() => setPosition(null)}
        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors ml-0.5"
        title="Dismiss popup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
