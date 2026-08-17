'use client';

import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCw,
  Volume2,
  VolumeX,
  Edit3,
  Trash2,
  MoreHorizontal,
  Reply,
} from 'lucide-react';

interface MessageActionsProps {
  messageId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  feedback?: string | null;
  theme?: 'dark' | 'light';
  onEdit?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  onFeedback?: (rating: 'LIKE' | 'DISLIKE') => void;
  onEditAsPrompt?: (text: string) => void;
  onReply?: (content: string) => void;
}

export default function MessageActions({
  messageId,
  role,
  content,
  feedback,
  theme = 'dark',
  onEdit,
  onRegenerate,
  onDelete,
  onFeedback,
  onEditAsPrompt,
  onReply,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<string | null | undefined>(feedback);
  const moreRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleRate = (rating: 'LIKE' | 'DISLIKE') => {
    setCurrentFeedback(rating);
    if (onFeedback) onFeedback(rating);
  };

  const toolbarContainer = isLight
    ? 'bg-white/95 border border-slate-200/90 text-slate-600 shadow-sm rounded-xl px-2 py-0.5 inline-flex items-center gap-1 backdrop-blur-md'
    : 'bg-[#121422]/90 border border-purple-500/25 text-slate-300 shadow-md shadow-black/40 rounded-xl px-2 py-0.5 inline-flex items-center gap-1 backdrop-blur-md';

  const iconBtn = `w-7 h-7 rounded-lg transition-all duration-150 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 hover:scale-[1.05] active:scale-95`;
  const iconBtnHover = isLight
    ? 'hover:bg-slate-100 hover:text-purple-700 text-slate-500'
    : 'hover:bg-purple-600/20 hover:text-purple-300 text-slate-400';

  return (
    <div className={`mt-1.5 ${toolbarContainer} transition-all duration-200`}>
      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy message text'}
        title={copied ? 'Copied!' : 'Copy'}
        className={`${iconBtn} ${iconBtnHover}`}
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>

      {/* Reply to message */}
      {onReply && (
        <button
          type="button"
          onClick={() => onReply(content)}
          aria-label="Reply to message"
          title="Reply"
          className={`${iconBtn} ${iconBtnHover}`}
        >
          <Reply className="w-3.5 h-3.5" />
        </button>
      )}

      {/* USER: Edit */}
      {role === 'USER' && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit message"
          title="Edit message"
          className={`${iconBtn} ${iconBtnHover}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ASSISTANT: Read aloud */}
      {role === 'ASSISTANT' && (
        <button
          type="button"
          onClick={handleSpeech}
          aria-label={isSpeaking ? 'Stop reading aloud' : 'Read message aloud'}
          title={isSpeaking ? 'Stop' : 'Read aloud'}
          className={`${iconBtn} ${isSpeaking ? 'text-purple-400 bg-purple-500/20' : iconBtnHover}`}
        >
          {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      )}

      {/* ASSISTANT: Regenerate */}
      {role === 'ASSISTANT' && onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          aria-label="Regenerate AI response"
          title="Regenerate response"
          className={`${iconBtn} ${iconBtnHover}`}
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* ASSISTANT: Thumbs Up / Down */}
      {role === 'ASSISTANT' && (
        <>
          <button
            type="button"
            onClick={() => handleRate('LIKE')}
            aria-label="Mark response as helpful"
            title="Good response"
            className={`${iconBtn} ${
              currentFeedback === 'LIKE'
                ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-500/30'
                : iconBtnHover
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleRate('DISLIKE')}
            aria-label="Mark response as unhelpful"
            title="Bad response"
            className={`${iconBtn} ${
              currentFeedback === 'DISLIKE'
                ? 'text-rose-400 bg-rose-500/20 border border-rose-500/30'
                : iconBtnHover
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* More menu */}
      <div className="relative" ref={moreRef}>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-label="More message options"
          title="More options"
          className={`${iconBtn} ${iconBtnHover}`}
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {showMore && (
          <div
            className={`absolute bottom-full mb-2 ${role === 'USER' ? 'right-0' : 'left-0'} min-w-[160px] rounded-xl border shadow-2xl overflow-hidden z-50 text-xs font-medium whitespace-nowrap ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-300/50'
                : 'bg-[#161826] border-purple-500/30 text-slate-100 shadow-black/80'
            }`}
          >
            {role === 'ASSISTANT' && onEditAsPrompt && (
              <button
                type="button"
                onClick={() => { setShowMore(false); onEditAsPrompt(content); }}
                aria-label="Edit assistant response as prompt"
                className={`w-full flex items-center gap-2 px-3 py-2 transition-colors ${
                  isLight ? 'hover:bg-purple-50 text-slate-800' : 'hover:bg-purple-600/20 text-slate-100'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                <span>Edit as prompt</span>
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => { setShowMore(false); onDelete(); }}
                aria-label="Delete message permanently"
                className={`w-full flex items-center gap-2 px-3 py-2 text-rose-400 hover:bg-rose-500/10 transition-colors ${
                  role === 'ASSISTANT' && onEditAsPrompt ? 'border-t border-white/[0.08]' : ''
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete message</span>
              </button>
            )}
          </div>
        )}

        {showMore && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMore(false)}
          />
        )}
      </div>
    </div>
  );
}
