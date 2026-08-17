'use client';

import React, { useState, useEffect } from 'react';
import {
  ImageIcon,
  Sparkles,
  Search,
  Download,
  Trash2,
  RotateCw,
  Edit3,
  X,
  Loader2,
  Maximize2,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react';
import {
  getGeneratedImages,
  generateImage,
  downloadImage,
  deleteImage,
  bulkDeleteImages,
  regenerateImage,
  editImagePrompt,
  getBackendUrl,
} from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';

interface GeneratedImageItem {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  model: string;
  provider: string;
  createdAt: string;
}

const getImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendUrl = getBackendUrl();
  return `${backendUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ImageGalleryView() {
  const [images, setImages] = useState<GeneratedImageItem[]>([]);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Generation State
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);

  // Multi-select & Bulk Delete State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [selectedImage, setSelectedImage] = useState<GeneratedImageItem | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [editingPromptText, setEditingPromptText] = useState('');

  // Custom Confirmation Modal State
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

  const loadImages = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await getGeneratedImages(1, 50);
      if (data.images) {
        setImages(data.images);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load generated images');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImages();
  }, [filter]);

  const handleCreateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const data = await generateImage(prompt, aspectRatio);
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
        setPrompt('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Single Image Delete
  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Generated Image',
      message: 'Are you sure you want to delete this AI generated image permanently? This action cannot be undone and will erase the file from server storage.',
      confirmText: 'Delete Image',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteImage(id);
          setImages((prev) => prev.filter((img) => img.id !== id));
          setSelectedIds((prev) => prev.filter((item) => item !== id));
          if (selectedImage?.id === id) setSelectedImage(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete image');
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  // Bulk Multi-Select Image Delete
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedIds.length} Selected Images`,
      message: `Are you sure you want to permanently delete ${selectedIds.length} selected AI images? This action cannot be undone and will delete all files from storage.`,
      confirmText: `Delete ${selectedIds.length} Images`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await bulkDeleteImages(selectedIds);
          setImages((prev) => prev.filter((img) => !selectedIds.includes(img.id)));
          if (selectedImage && selectedIds.includes(selectedImage.id)) {
            setSelectedImage(null);
          }
          setSelectedIds([]);
          setIsSelectMode(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to bulk delete images');
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const toggleSelectCard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredImages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredImages.map((img) => img.id));
    }
  };

  const handleRegenerate = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await regenerateImage(id);
      if (data.image) {
        setImages((prev) => [data.image, ...prev]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to regenerate image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEditedPrompt = async () => {
    if (!selectedImage || !editingPromptText.trim()) return;
    setIsLoading(true);
    try {
      const data = await editImagePrompt(selectedImage.id, editingPromptText);
      if (data.image) {
        setImages((prev) => prev.map((img) => (img.id === selectedImage.id ? data.image : img)));
        setSelectedImage(data.image);
        setIsEditingPrompt(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to edit image prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredImages = images.filter((img) =>
    img.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto p-4 md:p-6 space-y-6">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={confirmModal.isLoading}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      {/* Header & Studio Mode */}
      <div className="bg-white dark:bg-[#0c0e17] border border-amber-200/80 dark:border-purple-500/20 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-400">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">AI Image Generation Studio</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Create high-resolution AI art, wallpapers, and photorealistic graphics using FLUX models.
              </p>
            </div>
          </div>
        </div>

        {/* Real Image Generation Form */}
        <form onSubmit={handleCreateImage} className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate... (e.g. 'Lord Shiva meditating on Mount Kailash, ultra realistic 8k, photorealistic')"
              className="flex-1 bg-white dark:bg-slate-950 border border-amber-200/80 dark:border-purple-500/20 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50 disabled:opacity-40 transition-all flex-shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating AI Image...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Image</span>
                </>
              )}
            </button>
          </div>

          {/* Aspect Ratio Selectors */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-300">Aspect Ratio:</span>
            {(['1:1', '16:9', '9:16'] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1 rounded-lg border transition-all ${
                  aspectRatio === ratio
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'bg-white dark:bg-slate-950 border-amber-200/80 dark:border-slate-800 hover:border-purple-400 text-slate-700 dark:text-slate-400'
                }`}
              >
                {ratio === '1:1' && 'Square (1:1)'}
                {ratio === '16:9' && 'Landscape (16:9)'}
                {ratio === '9:16' && 'Portrait (9:16)'}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Gallery Filter, Multi-Select & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#0c0e17] p-3 rounded-2xl border border-amber-200/80 dark:border-purple-500/20 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search generated prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-950 border border-amber-200/80 dark:border-purple-500/20 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Multi-Select & Bulk Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isSelectMode ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-1.5"
              >
                {selectedIds.length === filteredImages.length ? (
                  <>
                    <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="w-3.5 h-3.5 text-slate-400" /> Select All ({filteredImages.length})
                  </>
                )}
              </button>

              <button
                onClick={handleBulkDelete}
                disabled={selectedIds.length === 0}
                className="px-3.5 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/80 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 hover:text-red-900 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>

              <button
                onClick={() => {
                  setIsSelectMode(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsSelectMode(true)}
              className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 hover:text-purple-950 text-xs font-medium flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Select & Bulk Delete
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Image Grid Display */}
      {isLoading && images.length === 0 ? (
        <div className="py-16 text-center text-purple-400 flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="text-xs">Loading image gallery...</span>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-[#0c0e17]/50 rounded-2xl border border-dashed border-purple-500/20">
          <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Generated Images Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the creation bar above to generate photorealistic AI artwork or wallpapers!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map((img) => {
            const isSelected = selectedIds.includes(img.id);

            return (
              <div
                key={img.id}
                onClick={(e) => {
                  if (isSelectMode) {
                    toggleSelectCard(img.id, e);
                  } else {
                    setSelectedImage(img);
                    setEditingPromptText(img.prompt);
                    setIsEditingPrompt(false);
                  }
                }}
                className={`group relative bg-[#0c0e17] border rounded-2xl overflow-hidden cursor-pointer transition-all shadow-lg hover:shadow-purple-950/50 ${
                  isSelected
                    ? 'border-purple-500 ring-2 ring-purple-500/50'
                    : 'border-purple-500/20 hover:border-purple-500/60'
                }`}
              >
                {/* Multi-Select Checkbox Overlay */}
                {isSelectMode && (
                  <div
                    onClick={(e) => toggleSelectCard(img.id, e)}
                    className="absolute top-2 left-2 z-20 p-1 rounded-lg bg-black/60 backdrop-blur-md cursor-pointer hover:scale-105 transition-transform"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-purple-400 fill-purple-950" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                )}

                <div className="aspect-square bg-slate-950 relative overflow-hidden">
                  <img
                    src={getImageUrl(img.url)}
                    alt={img.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                    <p className="text-xs text-white line-clamp-2 font-medium">{img.prompt}</p>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-[10px] text-purple-300 font-mono">{img.aspectRatio}</span>
                      <button className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-md">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Detail Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f0f18] border border-purple-500/30 rounded-2xl max-w-2xl w-full p-5 shadow-2xl space-y-4 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Image Details & Actions
              </h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden border border-purple-500/20">
              <img src={getImageUrl(selectedImage.url)} alt={selectedImage.prompt} className="w-full h-full object-contain" />
            </div>

            {/* Prompt View or Edit */}
            {isEditingPrompt ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={editingPromptText}
                  onChange={(e) => setEditingPromptText(e.target.value)}
                  className="w-full bg-slate-950 border border-purple-500/40 rounded-xl p-3 text-xs text-slate-100 focus:outline-none"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => setIsEditingPrompt(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditedPrompt}
                    className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-semibold"
                  >
                    Save & Generate New Prompt
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-3 rounded-xl border border-purple-500/20 text-xs space-y-1">
                <div className="text-[10px] text-purple-400 font-semibold uppercase">Generation Prompt</div>
                <p className="text-slate-200 leading-relaxed">{selectedImage.prompt}</p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-500/20 text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(selectedImage.id)}
                  className="px-3 py-2 rounded-xl bg-purple-950 border border-purple-500/40 text-purple-300 hover:text-white flex items-center gap-1.5 font-medium"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={() => setIsEditingPrompt(true)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Prompt
                </button>
                <button
                  onClick={() => handleRegenerate(selectedImage.id)}
                  className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 font-medium"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Regenerate
                </button>
              </div>

              <button
                onClick={() => handleDelete(selectedImage.id)}
                className="px-3 py-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 hover:text-red-100 flex items-center gap-1.5 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
