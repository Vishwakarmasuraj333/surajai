'use client';

import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  RotateCw,
  Edit3,
  Trash2,
  Heart,
  MoreHorizontal,
} from 'lucide-react';
import { downloadImage } from '@/lib/api';

interface ImageActionsProps {
  imageId: string;
  imageUrl: string;
  prompt: string;
  isFavorite?: boolean;
  onRegenerate?: () => void;
  onEditPrompt?: () => void;
  onDelete?: () => void;
}

export default function ImageActions({
  imageId,
  imageUrl,
  prompt,
  isFavorite = false,
  onRegenerate,
  onEditPrompt,
  onDelete,
}: ImageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [fav, setFav] = useState(isFavorite);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadImage(imageId);
    } catch (err) {
      // Fallback direct browser download link
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `surajai_gen_${imageId}.png`;
      a.click();
    }
  };

  return (
    <div className="relative group/actions inline-flex items-center gap-1.5 mt-2">
      {/* Desktop Toolbar */}
      <div className="hidden sm:flex items-center gap-1 bg-[#12121c]/90 border border-white/[0.08] backdrop-blur-md rounded-xl px-2.5 py-1 shadow-lg text-slate-400 text-xs font-medium">
        <button
          type="button"
          onClick={handleDownload}
          aria-label="Download generated image"
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          title="Download image"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="text-[11px]">Download</span>
        </button>

        {onEditPrompt && (
          <button
            type="button"
            onClick={onEditPrompt}
            aria-label="Edit image generation prompt"
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            title="Edit prompt"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Edit Prompt</span>
          </button>
        )}

        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            aria-label="Regenerate image"
            className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            title="Regenerate image"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="text-[11px]">Regenerate</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleCopyLink}
          aria-label={copied ? 'Copied image link' : 'Copy image URL'}
          className="p-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          title={copied ? 'Copied URL!' : 'Copy image link'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete generated image"
            className="p-1.5 px-2 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 border border-rose-500/20 transition-colors flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            title="Delete image"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Delete</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        type="button"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-[#12121c] border border-white/[0.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        aria-label="Image action options menu"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Mobile Popover */}
      {showMobileMenu && (
        <div className="sm:hidden fixed inset-x-4 bottom-20 z-50 bg-[#12121c] border border-white/[0.08] rounded-2xl p-3 shadow-2xl space-y-2 text-sm">
          <button
            onClick={() => { setShowMobileMenu(false); handleDownload(); }}
            aria-label="Download Image"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 font-medium"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Download Image</span>
          </button>

          {onEditPrompt && (
            <button
              onClick={() => { setShowMobileMenu(false); onEditPrompt(); }}
              aria-label="Edit Prompt"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 font-medium"
            >
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>Edit Prompt</span>
            </button>
          )}

          {onRegenerate && (
            <button
              onClick={() => { setShowMobileMenu(false); onRegenerate(); }}
              aria-label="Regenerate Image"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 font-medium"
            >
              <RotateCw className="w-4 h-4 text-purple-400" />
              <span>Regenerate Image</span>
            </button>
          )}

          <button
            onClick={() => { setShowMobileMenu(false); handleCopyLink(); }}
            aria-label="Copy Link"
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/10 text-slate-200 font-medium"
          >
            <Copy className="w-4 h-4 text-purple-400" />
            <span>Copy Link</span>
          </button>

          {onDelete && (
            <button
              onClick={() => { setShowMobileMenu(false); onDelete(); }}
              aria-label="Delete Image"
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-rose-500/20 text-rose-400 font-medium pt-2 border-t border-white/[0.08]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Image</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

