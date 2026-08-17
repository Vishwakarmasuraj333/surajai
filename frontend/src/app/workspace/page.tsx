'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/context/AuthContext';
import {
  fetchWithAuth,
  streamChatResponse,
  editMessage as editMessageApi,
  deleteMessage as deleteMessageApi,
  bulkDeleteConversations,
  deleteAllConversations,
  toggleArchiveConversation,
  togglePinConversation,
  updateConversationTitle,
  exportConversation,
  generateImage,
  getBackendUrl,
} from '@/lib/api';
import KnowledgeView from '@/components/KnowledgeView';
import MemoriesView from '@/components/MemoriesView';
import SettingsView from '@/components/SettingsView';
import AdminView from '@/components/AdminView';
import ImageGalleryView from '@/components/ImageGalleryView';
import CameraModal from '@/components/CameraModal';
import ConfirmModal from '@/components/ConfirmModal';
import MessageActions from '@/components/chat/MessageActions';
import ImageActions from '@/components/chat/ImageActions';
import TextSelectionToolbar from '@/components/chat/TextSelectionToolbar';
import SurajAILogo from '@/components/SurajAILogo';

import {
  Sparkles,
  Plus,
  MessageSquare,
  BookOpen,
  Brain,
  Settings,
  Search,
  Send,
  Square,
  Bot,
  Menu,
  X,
  LogOut,
  Trash2,
  Copy,
  Check,
  AlertCircle,
  Cpu,
  Mic,
  MicOff,
  Paperclip,
  ShieldAlert,
  Wrench,
  Camera,
  Archive,
  Pin,
  Edit3,
  Download,
  ImageIcon,
  Loader2,
  ArrowRight,
  Eye,
  Sun,
  Moon,
  Reply,
} from 'lucide-react';

interface ModelMeta {
  id: string;
  name: string;
  provider: string;
  description: string;
  isConfigured: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  model: string;
  pinned?: boolean;
  archivedAt?: string | null;
  updatedAt: string;
}

interface CitationSource {
  documentId: string;
  documentName: string;
  content: string;
}

interface ExecutedTool {
  toolName: string;
  arguments: any;
  result: any;
}

interface ChatMessage {
  id?: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  model?: string;
  feedback?: 'LIKE' | 'DISLIKE' | null;
  citationSources?: CitationSource[];
  tools?: ExecutedTool[];
  generatedImageUrl?: string;
  generatedImageId?: string;
  createdAt?: string;
}

export default function WorkspaceApp() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  // Theme State: Light / Dark
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [activeTab, setActiveTab] = useState<'chat' | 'images' | 'knowledge' | 'memories' | 'settings' | 'admin'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationFilter, setConversationFilter] = useState<'active' | 'archived' | 'pinned'>('active');

  // Mode Switcher: Chat vs Image Generation
  const [composerMode, setComposerMode] = useState<'chat' | 'image'>('chat');
  const [imageAspectRatio, setImageAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [imageProvider, setImageProvider] = useState<'openai' | 'pollinations'>('openai');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // AI & Conversation State
  const [models, setModels] = useState<ModelMeta[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.6-flash');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Editing, Camera & Custom Professional Confirmation Modals
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

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

  // Input, Streaming & Attachments
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<Array<{ name: string; content: string; type: string }>>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Voice STT & TTS
  const [isListening, setIsListening] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerInputRef = useRef<HTMLTextAreaElement>(null);

  // Load theme preference & sync document element class
  useEffect(() => {
    const savedTheme = localStorage.getItem('surajai_theme') as 'dark' | 'light' | null;
    const currentTheme = savedTheme || 'dark';
    setTheme(currentTheme);
    if (currentTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('surajai_theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  };

  // Protect route
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Fetch available AI models
  useEffect(() => {
    if (isAuthenticated) {
      fetchWithAuth('/api/models')
        .then((data) => {
          if (data.models && data.models.length > 0) {
            setModels(data.models);
            const configured = data.models.find((m: ModelMeta) => m.isConfigured);
            if (configured) {
              setSelectedModel(configured.id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const data = await fetchWithAuth(`/api/conversations?filter=${conversationFilter}`);
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err: any) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, conversationFilter]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  // Auto-expand textarea on typing or pasting large text
  useEffect(() => {
    if (composerInputRef.current) {
      composerInputRef.current.style.height = 'auto';
      composerInputRef.current.style.height = Math.min(composerInputRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputMessage]);

  // Load specific conversation messages
  const handleSelectConversation = async (convId: string) => {
    try {
      setActiveConvId(convId);
      setActiveTab('chat');
      setSidebarOpen(false);
      setErrorMsg(null);
      const data = await fetchWithAuth(`/api/conversations/${convId}`);
      if (data.conversation) {
        setSelectedModel(data.conversation.model || 'gemini-3.6-flash');
        setMessages(
          data.conversation.messages.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            model: m.model,
            feedback: m.feedback,
            citationSources: m.citationSources,
            createdAt: m.createdAt,
          }))
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load conversation messages');
    }
  };

  const handleNewChat = () => {
    setActiveConvId(undefined);
    setMessages([]);
    setErrorMsg(null);
    setActiveTab('chat');
    setSidebarOpen(false);
  };

  // Rename Conversation Title State
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingConvTitle, setEditingConvTitle] = useState<string>('');

  const handleStartRename = (e: React.MouseEvent, conv: ConversationItem) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingConvTitle(conv.title);
  };

  const handleSaveRename = async (convId: string) => {
    if (!editingConvTitle.trim()) {
      setEditingConvId(null);
      return;
    }
    try {
      await updateConversationTitle(convId, editingConvTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, title: editingConvTitle.trim() } : c))
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rename conversation title');
    } finally {
      setEditingConvId(null);
      setEditingConvTitle('');
    }
  };

  // Pin / Unpin Conversation Handler
  const handlePinConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await togglePinConversation(convId);
      loadConversations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to pin conversation');
    }
  };

  // Professional Modal Conversation Delete
  const promptDeleteConversation = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Conversation',
      message: 'Are you sure you want to delete this conversation permanently? This action cannot be undone and will erase all associated messages.',
      confirmText: 'Delete Chat',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await fetchWithAuth(`/api/conversations/${convId}`, { method: 'DELETE' });
          setConversations((prev) => prev.filter((c) => c.id !== convId));
          if (activeConvId === convId) {
            handleNewChat();
          }
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete conversation');
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleArchiveConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    try {
      await toggleArchiveConversation(convId);
      loadConversations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to archive conversation');
    }
  };

  const handleExportConversation = async (e: React.MouseEvent, convId: string, format: 'json' | 'txt' | 'md') => {
    e.stopPropagation();
    try {
      const targetFormat = format === 'md' ? 'markdown' : format;
      await exportConversation(convId, targetFormat);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to export conversation');
    }
  };

  // Message Editing & Regeneration
  const handleStartEdit = (msg: ChatMessage) => {
    if (!msg.id) return;
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
    setInputMessage(msg.content);
    composerInputRef.current?.focus();
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editingContent.trim()) return;

    const newPrompt = editingContent.trim();
    setEditingMessageId(null);
    setEditingContent('');
    setErrorMsg(null);

    // Truncate: keep only messages up to and including the edited one (ChatGPT style)
    const msgIndex = messages.findIndex((m) => m.id === msgId);
    const truncatedMessages = messages
      .slice(0, msgIndex + 1)
      .map((m) => (m.id === msgId ? { ...m, content: newPrompt } : m));
    setMessages(truncatedMessages);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('surajai_access_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/messages/${msgId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newPrompt, stream: true }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to save message edit');
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantText = '';
      let newAssistantMsgId = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.replace('data: ', ''));
              if (event.type === 'text_delta' && event.content) {
                assistantText += event.content;
                setStreamingContent(assistantText);
              } else if (event.type === 'message_complete') {
                newAssistantMsgId = event.messageId || '';
              } else if (event.type === 'error') {
                setErrorMsg(event.error?.message || 'Streaming error occurred');
              }
            } catch (e) {}
          }
        }
      }

      setMessages([
        ...truncatedMessages,
        {
          id: newAssistantMsgId || undefined,
          role: 'ASSISTANT',
          content: assistantText,
          model: selectedModel,
        },
      ]);
      loadConversations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save message edit');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };


  // Professional Modal Message Delete
  const promptDeleteMessage = (msgId?: string) => {
    if (!msgId) return;
    setConfirmModal({
      isOpen: true,
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      confirmText: 'Delete',
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteMessageApi(msgId);
          setMessages((prev) => prev.filter((m) => m.id !== msgId));
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to delete message');
          setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
        }
      },
    });
  };

  const handleRegenerateResponse = async () => {
    if (!activeConvId || isStreaming) return;

    setIsStreaming(true);
    setStreamingContent('');
    setErrorMsg(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('surajai_access_token') : null;
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/conversations/${activeConvId}/regenerate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) throw new Error('Regeneration request failed');

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.replace('data: ', ''));
              if (event.type === 'text_delta' && event.content) {
                fullText += event.content;
                setStreamingContent(fullText);
              }
            } catch (e) {}
          }
        }
      }

      handleSelectConversation(activeConvId);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to regenerate response');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  // Real Image Generation Flow in Chat
  const handleGenerateImageInChat = async () => {
    if (!inputMessage.trim() || isGeneratingImage) return;

    const promptText = inputMessage;
    setInputMessage('');
    setErrorMsg(null);
    setIsGeneratingImage(true);

    const userMsg: ChatMessage = { role: 'USER', content: `🎨 Generate Image: "${promptText}"` };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const data = await generateImage(promptText, imageAspectRatio, imageProvider === 'openai' ? 'dall-e-3' : 'flux', activeConvId, imageProvider);
      if (data.image) {
        const assistantMsg: ChatMessage = {
          role: 'ASSISTANT',
          content: `Here is your generated image for: **"${promptText}"** ✨`,
          generatedImageUrl: data.image.url,
          generatedImageId: data.image.id,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Image generation failed');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Camera Capture Handler
  const handleCameraCapture = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setAttachments((prev) => [
        ...prev,
        { name: file.name, content: text, type: file.type || 'image/jpeg' },
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Handle File Upload Attachment in Chat
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAttachments((prev) => [
          ...prev,
          { name: file.name, content: text, type: file.type || 'text/plain' },
        ]);
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  // Voice Input (Speech-to-Text)
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setErrorMsg('Microphone access permission was dismissed. Please enable microphone permissions in browser address bar.');
      } else {
        console.warn('Speech recognition warning:', event.error);
      }
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Submit Feedback (Like / Dislike)
  const handleFeedback = async (messageId?: string, feedbackType?: 'LIKE' | 'DISLIKE') => {
    if (!messageId) return;
    try {
      await fetchWithAuth(`/api/messages/${messageId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: feedbackType }),
      });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, feedback: feedbackType } : m))
      );
    } catch (err) {
      console.error('Feedback failed:', err);
    }
  };

  const handleEditAsPrompt = (text: string) => {
    setInputMessage(text);
    setActiveTab('chat');
    setTimeout(() => {
      composerInputRef.current?.focus();
      composerInputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // Parse Recommended Next Steps & Follow-up Chips from Assistant Response
  const parseRecommendedNextSteps = (content: string): { cleanContent: string; recommendations: string[] } => {
    if (!content) return { cleanContent: '', recommendations: [] };

    const lowerContent = content.toLowerCase();
    const headers = [
      '### recommended next steps 🚀',
      '### recommended next steps',
      '### 🚀 next steps',
      '### 💡 next ideas',
      '### next steps',
      '### you can ask next',
      '### recommended 🚀',
      '### recommended',
      '### continue with',
      '🚀 next steps',
      '💡 next ideas',
      'next steps:',
      'next steps',
    ];

    let recIndex = -1;
    for (const h of headers) {
      const idx = lowerContent.lastIndexOf(h);
      if (idx !== -1) {
        recIndex = idx;
        break;
      }
    }

    if (recIndex === -1) return { cleanContent: content, recommendations: [] };

    const cleanContent = content.substring(0, recIndex).trim();
    const recSection = content.substring(recIndex);

    const recommendations: string[] = [];
    const lines = recSection.split('\n').map((l) => l.trim());

    for (const line of lines) {
      if (!line) continue;
      if (headers.some((h) => line.toLowerCase().includes(h))) continue;

      let cleanItem = line
        .replace(/^[-*•]\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^\[\s*/, '')
        .replace(/\s*\]$/, '')
        .trim();

      if (cleanItem && cleanItem.length > 3 && !recommendations.includes(cleanItem)) {
        recommendations.push(cleanItem);
      }
    }

    return { cleanContent, recommendations: recommendations.slice(0, 4) };
  };


  // Reply to Message State
  const [replyingToMessage, setReplyingToMessage] = useState<{ id?: string; role: string; content: string } | null>(null);

  const handleReplyToMessage = (msg: ChatMessage) => {
    setReplyingToMessage({
      id: msg.id,
      role: msg.role,
      content: msg.content,
    });
    setActiveTab('chat');
  };

  // Send Chat Stream
  const handleSendMessage = async (overridePrompt?: string) => {
    if (composerMode === 'image') {
      return handleGenerateImageInChat();
    }

    let messageText = overridePrompt || inputMessage;
    if ((!messageText.trim() && attachments.length === 0) || isStreaming) return;

    if (replyingToMessage) {
      const authorName = replyingToMessage.role === 'USER' ? 'User' : 'SurajAI';
      const quoteSnippet = replyingToMessage.content.slice(0, 150);
      messageText = `[Replying to ${authorName}: "${quoteSnippet}${replyingToMessage.content.length > 150 ? '...' : ''}"]\n\n${messageText}`;
      setReplyingToMessage(null);
    }

    setErrorMsg(null);
    setInputMessage('');
    const sentAttachments = [...attachments];
    setAttachments([]);

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'USER', content: messageText },
    ];
    setMessages(updatedMessages);
    setIsStreaming(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let assistantText = '';
    let currentConvId = activeConvId;
    let fetchedCitations: CitationSource[] = [];
    let fetchedTools: ExecutedTool[] = [];

    try {
      await streamChatResponse(
        '/api/chat',
        {
          conversationId: currentConvId,
          message: messageText,
          model: selectedModel,
          attachments: sentAttachments,
        },
        (chunk: any) => {
          if (chunk.type === 'message_start') {
            if (chunk.conversationId) {
              currentConvId = chunk.conversationId;
              setActiveConvId(chunk.conversationId);
            }
            if (chunk.citations) {
              fetchedCitations = chunk.citations;
            }
            if (chunk.tools) {
              fetchedTools = chunk.tools;
            }
          } else if (chunk.type === 'text_delta' && chunk.content) {
            assistantText += chunk.content;
            setStreamingContent(assistantText);
          } else if (chunk.type === 'error') {
            setErrorMsg(chunk.error?.message || 'Streaming error occurred');
          }
        },
        controller.signal
      );

      setMessages([
        ...updatedMessages,
        {
          role: 'ASSISTANT',
          content: assistantText,
          model: selectedModel,
          citationSources: fetchedCitations,
          tools: fetchedTools,
        },
      ]);
      loadConversations();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMsg(err.message || 'Connection lost during streaming.');
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleAskSurajAISelection = (selectedText: string) => {
    handleSendMessage(`SurajAI, please explain this: "${selectedText}"`);
  };

  const handleEditSelectionInComposer = (selectedText: string) => {
    setInputMessage(selectedText);
    composerInputRef.current?.focus();
    composerInputRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.pinned);
  const unpinnedConversations = filteredConversations.filter((c) => !c.pinned);

  const hasImageAttachment = attachments.some((a) => a.type.startsWith('image/'));

  // Theme Class Names for Dynamic Light/Dark switch
  const isDark = theme === 'dark';

  const themeClasses = {
    bg:              isDark ? 'bg-[#0b0c14] text-slate-100'                                            : 'bg-[#fdfbf7] text-slate-900',
    sidebar:         isDark ? 'bg-[#0f111a] border-purple-500/20 text-slate-200'                       : 'bg-[#faf7f2] border-amber-200/60 text-slate-900 shadow-sm',
    header:          isDark ? 'bg-[#0f111a]/90 border-purple-500/20 text-slate-100 backdrop-blur'      : 'bg-[#faf7f2]/90 border-amber-200/60 text-slate-900 shadow-sm backdrop-blur',
    card:            isDark ? 'bg-[#151726]/90 border border-purple-500/15 text-slate-100'             : 'bg-white border border-amber-200/80 text-slate-900 shadow-sm hover:border-purple-300 hover:shadow-md',
    userBubble:                'bg-purple-600 text-white',
    assistantBubble: isDark ? 'bg-[#161828]/90 border-purple-500/15 text-slate-100'                   : 'bg-white border-amber-200/70 text-slate-900 shadow-sm',
    composerBg:      isDark ? 'bg-[#0f111a] border-purple-500/20'                                     : 'bg-[#faf7f2]/90 border-amber-200/80 shadow-md backdrop-blur-md',
    inputBg:         isDark ? 'bg-[#07080f] border-purple-500/20 text-slate-100 placeholder:text-slate-500' : 'bg-white border-amber-200/80 text-slate-900 placeholder:text-slate-500 font-medium',
    itemHover:       isDark ? 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-100'             : 'hover:bg-amber-100/60 text-slate-700 hover:text-slate-900',
    activeItem:      isDark ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'                 : 'bg-purple-100/80 text-purple-900 border-purple-300 font-semibold',
    searchBg:        isDark ? 'bg-[#0a0b12] border-purple-500/20 placeholder:text-slate-600 text-slate-200' : 'bg-white border-amber-200/80 placeholder:text-slate-500 text-slate-900',
  };

  if (loading || !isAuthenticated) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} flex items-center justify-center text-purple-400`}>
        <Sparkles className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${themeClasses.bg} font-sans overflow-hidden transition-colors duration-200`}>
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        isLoading={confirmModal.isLoading}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
      />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-72 ${themeClasses.sidebar} border-r flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-inherit flex items-center justify-between">
          <Link href="/">
            <SurajAILogo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> New Conversation
          </button>
        </div>

        <div className="px-3 mb-2 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 ${themeClasses.inputBg} rounded-lg text-xs focus:outline-none focus:border-purple-500`}
            />
          </div>

          <div className={`flex items-center gap-1 ${themeClasses.inputBg} p-1 rounded-lg border text-[11px]`}>
            <button
              onClick={() => setConversationFilter('active')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${conversationFilter === 'active' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Active
            </button>
            <button
              onClick={() => setConversationFilter('archived')}
              className={`flex-1 py-1 rounded-md text-center transition-colors ${conversationFilter === 'archived' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
            >
              Archived
            </button>
          </div>
        </div>

        <div className="px-3 py-2 space-y-1 border-b border-inherit text-xs">
          <button
            onClick={() => { setActiveTab('chat'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${activeTab === 'chat' ? themeClasses.activeItem : themeClasses.itemHover}`}
          >
            <MessageSquare className="w-4 h-4" /> Chat Workspace
          </button>

          <button
            onClick={() => { setActiveTab('images'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${activeTab === 'images' ? themeClasses.activeItem : themeClasses.itemHover}`}
          >
            <ImageIcon className="w-4 h-4 text-purple-400" /> Image Studio & Gallery
          </button>

          <button
            onClick={() => { setActiveTab('knowledge'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${activeTab === 'knowledge' ? themeClasses.activeItem : themeClasses.itemHover}`}
          >
            <BookOpen className="w-4 h-4" /> Knowledge Base (RAG)
          </button>

          <button
            onClick={() => { setActiveTab('memories'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${activeTab === 'memories' ? themeClasses.activeItem : themeClasses.itemHover}`}
          >
            <Brain className="w-4 h-4" /> AI Memory
          </button>

          <button
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${activeTab === 'settings' ? themeClasses.activeItem : themeClasses.itemHover}`}
          >
            <Settings className="w-4 h-4" /> Settings
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => { setActiveTab('admin'); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-amber-950/60 text-amber-300 font-medium border border-amber-500/40' : 'text-amber-500/80 hover:bg-amber-950/30'}`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin Dashboard
            </button>
          )}
        </div>

        {/* Conversation List with Pinned Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {/* Pinned Chats Section */}
          {pinnedConversations.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider px-2 flex items-center gap-1">
                <Pin className="w-3 h-3 text-purple-400" /> Pinned Chats
              </div>
              {pinnedConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${activeConvId === conv.id ? themeClasses.activeItem : themeClasses.itemHover}`}
                >
                  <span className="truncate pr-2 font-medium">{conv.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handlePinConversation(e, conv.id)}
                      className="text-purple-400 hover:text-purple-300 p-1 rounded"
                      title="Unpin conversation"
                    >
                      <Pin className="w-3.5 h-3.5 fill-purple-400" />
                    </button>
                    <button
                      onClick={(e) => promptDeleteConversation(e, conv.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Conversations */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1">
              {conversationFilter === 'archived' ? 'Archived Chats' : 'Recent Conversations'}
            </div>
            {unpinnedConversations.length === 0 && pinnedConversations.length === 0 ? (
              <div className="text-xs text-slate-500 px-2 py-4 text-center">No chats found</div>
            ) : (
              unpinnedConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${activeConvId === conv.id ? themeClasses.activeItem : themeClasses.itemHover}`}
                >
                  <span className="truncate pr-2">{conv.title}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handlePinConversation(e, conv.id)}
                      className="text-slate-500 hover:text-purple-400 p-1 rounded"
                      title="Pin conversation"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleArchiveConversation(e, conv.id)}
                      className="text-slate-500 hover:text-purple-400 p-1 rounded"
                      title={conv.archivedAt ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => promptDeleteConversation(e, conv.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      title="Delete permanently"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={`p-3 border-t border-inherit ${themeClasses.sidebar} flex items-center justify-between text-xs`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 border border-purple-400/40 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs truncate text-slate-900 dark:text-slate-100">{user?.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg transition-colors flex-shrink-0" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className={`h-14 border-b border-inherit ${themeClasses.header} backdrop-blur-md px-4 flex items-center justify-between z-10`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white bg-white dark:bg-purple-950/60 border border-amber-200/80 dark:border-purple-500/30 transition-all active:scale-95 shadow-sm"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-purple-600 dark:text-purple-400 transition-transform duration-300 rotate-90" />
              ) : (
                <Menu className="w-5 h-5 transition-transform duration-300" />
              )}
            </button>

            <span className="font-semibold text-sm flex items-center gap-2">
              {activeTab === 'chat' && (activeConvId ? 'Conversation Session' : 'New Workspace Chat')}
              {activeTab === 'images' && 'AI Image Generation Studio & Gallery'}
              {activeTab === 'knowledge' && 'Document Knowledge Base'}
              {activeTab === 'memories' && 'Persistent AI Memories'}
              {activeTab === 'settings' && 'User Settings'}
              {activeTab === 'admin' && 'Admin Analytics Dashboard'}
            </span>
          </div>

          {activeTab === 'chat' && (
            <div className="flex items-center gap-3">
              <div className={`relative flex items-center gap-1.5 ${themeClasses.inputBg} border px-3 py-1.5 rounded-xl text-xs`}>
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="bg-transparent font-medium focus:outline-none cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </header>

        {activeTab === 'images' && <ImageGalleryView />}
        {activeTab === 'knowledge' && <KnowledgeView />}
        {activeTab === 'memories' && <MemoriesView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'admin' && <AdminView />}

        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
            <TextSelectionToolbar
              onAskSurajAI={handleAskSurajAISelection}
              onEditInComposer={handleEditSelectionInComposer}
            />
            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-40 space-y-6">
              {messages.length === 0 && !isStreaming ? (
                <div className="min-h-full flex flex-col items-center justify-center text-center space-y-5 max-w-xl mx-auto py-12 pt-16">
                  <div className="relative group hover:scale-110 transition-transform duration-300 my-3 flex items-center justify-center">
                    <SurajAILogo size="xl" showText={false} />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 dark:from-purple-300 dark:via-indigo-200 dark:to-white bg-clip-text text-transparent">
                    Welcome to SurajAI Workspace
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md font-medium">
                    SurajAI combines multi-model intelligence, real AI image generation, long-term persistent memory, document RAG retrieval, and live web search.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-3 text-xs text-left">
                    <button
                      type="button"
                      onClick={() => handleSendMessage("bhai JWT authentication kya hota hai simple Hinglish mein samjhao, beginner ke liye")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-purple-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-500/30 group-hover:scale-110 transition-transform">💬</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-purple-700 dark:text-purple-400 text-xs">Coding</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"JWT auth Hinglish mein samjhao"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setComposerMode('image');
                        setInputMessage("Futuristic neon Mumbai skyline at sunset, cyberpunk, photorealistic cinematic");
                      }}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-pink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-pink-100 dark:bg-pink-950/80 border border-pink-200 dark:border-pink-500/30 group-hover:scale-110 transition-transform">🎨</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-pink-700 dark:text-pink-400 text-xs">AI Art</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"Futuristic skyline image banao"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Mujhe ek study plan banao 30 days ka React aur Node.js seekhne ke liye, daily schedule ke saath")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 group-hover:scale-110 transition-transform">📚</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs">Study</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"30-day React & Node.js plan banao"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Mujhe best lo-fi music playlist recommend karo study aur focus ke liye with Spotify links")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-500/30 group-hover:scale-110 transition-transform">🎵</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-amber-700 dark:text-amber-400 text-xs">Music</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"Lo-fi study playlist suggest karo"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Bhai BGMI mein rank push karne ke pro tips batao, best guns aur strategy kya hai?")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/80 border border-cyan-200 dark:border-cyan-500/30 group-hover:scale-110 transition-transform">🎮</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-cyan-700 dark:text-cyan-400 text-xs">Gaming</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"BGMI rank push pro tips do"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Write a high-performance TypeScript async queue with priority support and retry logic")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-violet-100 dark:bg-violet-950/80 border border-violet-200 dark:border-violet-500/30 group-hover:scale-110 transition-transform">💻</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-violet-700 dark:text-violet-400 text-xs">Code</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"TypeScript async queue banao"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Mujhe public speaking aur confidence build karne ke 10 practical skill tips do")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-orange-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-orange-100 dark:bg-orange-950/80 border border-orange-200 dark:border-orange-500/30 group-hover:scale-110 transition-transform">🚀</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-orange-700 dark:text-orange-400 text-xs">Skills</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"Public speaking skills sikhao"</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendMessage("Remember that my main project is building SurajKart e-commerce platform with React and Node.js")}
                      className={`group p-4 rounded-2xl ${themeClasses.card} transition-all duration-200 hover:scale-[1.025] hover:-translate-y-0.5 flex items-start gap-3 border shadow-sm hover:border-rose-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500`}
                    >
                      <span className="text-xl p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-500/30 group-hover:scale-110 transition-transform">🧠</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-rose-700 dark:text-rose-400 text-xs">Memory</span>
                        <p className="text-slate-900 dark:text-slate-100 font-semibold leading-snug mt-0.5">"Mera project details yaad rakho"</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const { cleanContent, recommendations } = parseRecommendedNextSteps(msg.content);
                  return (
                    <div
                      key={msg.id || idx}
                      className={`group/msg flex items-start gap-3 max-w-4xl mx-auto ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'ASSISTANT' && (
                        <div className="flex-shrink-0 mt-1">
                          <SurajAILogo size="sm" showText={false} />
                        </div>
                      )}

                      <div className={`space-y-2 max-w-[85%] ${msg.role === 'USER' ? 'items-end flex flex-col' : 'items-start'}`}>
                        {/* Tool badges */}
                        {msg.tools && msg.tools.length > 0 && (
                          <div className="flex flex-wrap gap-2 text-xs">
                            {msg.tools.map((t, tid) => (
                              <span
                                key={tid}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                                  isDark ? 'bg-indigo-950/80 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                }`}
                              >
                                <Wrench className="w-3 h-3" /> Executed Tool: <strong>{t.toolName}</strong>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* ── ChatGPT-style inline edit mode ── */}
                        {editingMessageId === msg.id ? (
                          <div className="w-full flex flex-col items-end gap-2">
                            {/* Editable bubble — replaces the user bubble in-place */}
                            <textarea
                              rows={Math.max(2, editingContent.split('\n').length)}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelEdit();
                                }
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (msg.id && editingContent.trim()) handleSaveEdit(msg.id);
                                }
                              }}
                              className={`w-full rounded-2xl rounded-br-sm px-4 py-3 text-sm font-sans leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/70 ${
                                isDark
                                  ? 'bg-purple-700/80 text-white placeholder:text-purple-300 border border-purple-400/40'
                                  : 'bg-purple-600 text-white placeholder:text-purple-200 border border-purple-500/40'
                              }`}
                              autoFocus
                            />
                            {/* Action row */}
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] mr-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Shift+Enter newline · Esc cancel</span>
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                  isDark
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border border-slate-300'
                                }`}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => msg.id && editingContent.trim() && handleSaveEdit(msg.id)}
                                disabled={!editingContent.trim()}
                                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white flex items-center gap-1.5 shadow-md shadow-purple-900/30 transition-all"
                              >
                                <Send className="w-3 h-3" /> Send
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* ── View mode ── */
                          <>
                            {msg.role === 'USER' ? (
                              /* USER bubble with premium styling & hover edit pencil */
                              <div className="relative group/userBubble">
                                <div className="user-message-container px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words pr-12">
                                  {msg.content}
                                </div>
                                {msg.id && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(msg)}
                                    aria-label="Edit message"
                                    title="Edit message"
                                    className="absolute right-2 top-2.5 w-9 h-9 rounded-[10px] bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white opacity-0 group-hover/userBubble:opacity-100 focus:opacity-100 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              /* ASSISTANT — full-width prose + markdown */
                              <div className={`text-sm leading-relaxed space-y-3 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p({ children }: any) {
                                      return <div className="mb-3 last:mb-0">{children}</div>;
                                    },
                                    pre({ children }: any) {
                                      return <>{children}</>;
                                    },
                                    code({ node, inline, className, children, ...props }: any) {
                                      const match = /language-(\w+)/.exec(className || '');
                                      return !inline ? (
                                        <div className={`relative my-3 rounded-xl border overflow-x-auto text-xs font-mono shadow-md ${
                                          isDark ? 'bg-[#0d1117] border-purple-500/20 text-slate-100' : 'bg-slate-900 border-slate-700 text-slate-100'
                                        }`}>
                                          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                                            <span className="font-mono text-purple-400 font-semibold">{match ? match[1] : 'code'}</span>
                                            <button
                                              onClick={() => handleCopyCode(String(children), idx)}
                                              className="p-1 px-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 transition-colors"
                                              title="Copy Code"
                                            >
                                              {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                              <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                                            </button>
                                          </div>
                                          <pre className="font-mono text-purple-200 overflow-x-auto leading-relaxed px-4 py-3">
                                            <code className={className} {...props}>
                                              {children}
                                            </code>
                                          </pre>
                                        </div>
                                      ) : (
                                        <code
                                          className={`px-1.5 py-0.5 rounded font-mono text-xs ${
                                            isDark
                                              ? 'bg-purple-950/60 text-purple-300 border border-purple-500/30'
                                              : 'bg-purple-100 text-purple-800 border border-purple-200 font-medium'
                                          }`}
                                          {...props}
                                        >
                                          {children}
                                        </code>
                                      );
                                    },
                                  }}
                                >
                                  {cleanContent}
                                </ReactMarkdown>

                                {/* Generated AI Image */}
                                {msg.generatedImageUrl && (
                                  <div className={`mt-3 rounded-2xl overflow-hidden border shadow-xl max-w-md ${
                                    isDark ? 'border-purple-500/30 bg-slate-950' : 'border-slate-200 bg-white'
                                  }`}>
                                    <img
                                      src={
                                        msg.generatedImageUrl.startsWith('http://') || msg.generatedImageUrl.startsWith('https://')
                                          ? msg.generatedImageUrl
                                          : `${getBackendUrl()}${msg.generatedImageUrl.startsWith('/') ? '' : '/'}${msg.generatedImageUrl}`
                                      }
                                      alt="Generated AI"
                                      className="w-full h-auto object-cover"
                                    />
                                    {msg.generatedImageId && (
                                      <div className={`p-2 border-t flex justify-end ${isDark ? 'bg-slate-900 border-purple-500/20' : 'bg-slate-50 border-slate-200'}`}>
                                        <ImageActions
                                          imageId={msg.generatedImageId}
                                          imageUrl={
                                            msg.generatedImageUrl.startsWith('http://') || msg.generatedImageUrl.startsWith('https://')
                                              ? msg.generatedImageUrl
                                              : `${getBackendUrl()}${msg.generatedImageUrl.startsWith('/') ? '' : '/'}${msg.generatedImageUrl}`
                                          }
                                          prompt={msg.content}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Citations */}
                                {msg.citationSources && msg.citationSources.length > 0 && (
                                  <div className={`mt-3 pt-3 border-t space-y-1.5 text-xs ${isDark ? 'border-purple-500/20' : 'border-slate-200'}`}>
                                    <div className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                                      <BookOpen className="w-3.5 h-3.5" /> Sources:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {msg.citationSources.map((c, cid) => (
                                        <span
                                          key={cid}
                                          className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                                            isDark ? 'bg-purple-950/80 border-purple-500/30 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800'
                                          }`}
                                        >
                                          📄 {c.documentName}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {/* Recommendations */}
                                {msg.role === 'ASSISTANT' && recommendations.length > 0 && (
                                  <div className="pt-3 space-y-2.5">
                                    <div className={`text-xs font-bold tracking-wide flex items-center gap-1.5 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                                      <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                                      <span>Recommended next steps 🚀</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {recommendations.map((rec, rId) => (
                                        <button
                                          key={rId}
                                          type="button"
                                          onClick={() => handleSendMessage(rec)}
                                          aria-label={`Ask recommendation: ${rec}`}
                                          className={`group/rec px-3.5 py-2 rounded-2xl text-xs font-medium transition-all duration-180 flex items-center gap-2 border shadow-sm hover:scale-[1.02] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                                            isDark
                                              ? 'bg-[#161828] border-purple-500/30 text-purple-200 hover:bg-purple-600/20 hover:border-purple-400 hover:text-white shadow-purple-950/20'
                                              : 'bg-white border-purple-200 text-purple-900 hover:bg-purple-50 hover:border-purple-400 shadow-purple-900/5'
                                          }`}
                                        >
                                          <span>{rec}</span>
                                          <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover/rec:translate-x-0.5 transition-transform flex-shrink-0" />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Action toolbar — fade in on hover */}
                            {msg.id && (
                              <div className="opacity-0 group-hover/msg:opacity-100 transition-opacity duration-150">
                                <MessageActions
                                  messageId={msg.id}
                                  role={msg.role}
                                  content={msg.content}
                                  feedback={msg.feedback}
                                  theme={theme}
                                  onEdit={() => handleStartEdit(msg)}
                                  onRegenerate={handleRegenerateResponse}
                                  onDelete={() => promptDeleteMessage(msg.id!)}
                                  onFeedback={(rating) => handleFeedback(msg.id!, rating)}
                                  onEditAsPrompt={handleEditAsPrompt}
                                  onReply={() => handleReplyToMessage(msg)}
                                />
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {msg.role === 'USER' && (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 mt-1 shadow-sm ${
                          isDark ? 'bg-purple-950 border border-purple-500/40 text-purple-200' : 'bg-purple-600 text-white'
                        }`}>
                          {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {isStreaming && (
                <div className="flex items-start gap-3 max-w-4xl mx-auto">
                  <div className="flex-shrink-0 mt-1 animate-pulse">
                    <SurajAILogo size="sm" showText={false} />
                  </div>
                  <div className={`p-4 rounded-2xl ${themeClasses.assistantBubble} rounded-bl-none text-sm leading-relaxed max-w-[85%]`}>
                    {streamingContent ? (
                      <div className="streaming-cursor">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-400 text-xs">
                        <Sparkles className="w-4 h-4 animate-spin text-purple-400" /> Thinking & assembling context...
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isGeneratingImage && (
                <div className="flex items-start gap-3 max-w-4xl mx-auto">
                  <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 flex-shrink-0 mt-1 animate-pulse">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className={`p-4 rounded-2xl ${themeClasses.assistantBubble} rounded-bl-none text-xs flex items-center gap-2`}>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" /> Generating real AI image using FLUX model...
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="max-w-4xl mx-auto p-4 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-xs flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" /> {errorMsg}
                  </span>
                  <button onClick={() => handleSendMessage()} className="underline text-red-200 hover:text-white" aria-label="Retry request">
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Vision Prompts Bar when Image is Attached */}
            {hasImageAttachment && (
              <div className={`px-4 py-2 border-t flex items-center gap-2 overflow-x-auto text-xs ${
                isDark ? 'bg-purple-950/40 border-purple-500/30' : 'bg-purple-50 border-purple-200'
              }`}>
                <span className={`font-semibold flex items-center gap-1 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                  <Eye className="w-3.5 h-3.5" /> Vision Prompts:
                </span>
                <button
                  onClick={() => handleSendMessage("🔍 Describe this image in detail.")}
                  aria-label="Describe image prompt"
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
                    isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-500/20' : 'bg-white hover:bg-purple-100 text-slate-800 border-purple-200 shadow-sm'
                  }`}
                >
                  🔍 Describe image
                </button>
                <button
                  onClick={() => handleSendMessage("📝 Extract all text visible in this image.")}
                  aria-label="Extract text prompt"
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
                    isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-500/20' : 'bg-white hover:bg-purple-100 text-slate-800 border-purple-200 shadow-sm'
                  }`}
                >
                  📝 Extract text
                </button>
                <button
                  onClick={() => handleSendMessage("🎨 Analyze the design and UI layout of this image.")}
                  aria-label="Analyze design prompt"
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
                    isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-500/20' : 'bg-white hover:bg-purple-100 text-slate-800 border-purple-200 shadow-sm'
                  }`}
                >
                  🎨 Analyze design
                </button>
                <button
                  onClick={() => handleSendMessage("💻 Explain the code shown in this image.")}
                  aria-label="Explain code prompt"
                  className={`px-2.5 py-1 rounded-lg border text-xs transition-all ${
                    isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-purple-500/20' : 'bg-white hover:bg-purple-100 text-slate-800 border-purple-200 shadow-sm'
                  }`}
                >
                  💻 Explain code
                </button>
              </div>
            )}

            {attachments.length > 0 && (
              <div className={`px-4 py-2 border-t flex items-center gap-2 overflow-x-auto ${
                isDark ? 'bg-slate-950/80 border-purple-500/20 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                <span className="text-xs">Attached files:</span>
                {attachments.map((att, index) => (
                  <span key={index} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
                    isDark ? 'bg-purple-950 border-purple-500/30 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800'
                  }`}>
                    <Paperclip className="w-3 h-3" /> {att.name}
                    <button onClick={() => setAttachments(attachments.filter((_, i) => i !== index))} className="hover:text-red-500" aria-label={`Remove attachment ${att.name}`}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Floating Composer Container */}
            <div className="p-4 bg-transparent">
              <div className="max-w-4xl mx-auto space-y-2">
                {/* Mode Selector */}
                <div className="flex items-center justify-between text-xs px-2">
                  <div className={`flex items-center gap-1 ${themeClasses.inputBg} p-1 rounded-xl border`}>
                    <button
                      onClick={() => setComposerMode('chat')}
                      aria-label="Switch to Chat AI mode"
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                        composerMode === 'chat' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Chat AI
                    </button>
                    <button
                      onClick={() => setComposerMode('image')}
                      aria-label="Switch to Create Image mode"
                      className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5 ${
                        composerMode === 'image' ? 'bg-purple-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Create Image
                    </button>
                  </div>

                  {composerMode === 'image' && (
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1 ${themeClasses.inputBg} px-2 py-1 rounded-xl border`}>
                        <span className="text-[11px] text-slate-400">Provider:</span>
                        <button
                          onClick={() => setImageProvider('openai')}
                          aria-label="Select OpenAI DALL-E 3 provider"
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            imageProvider === 'openai' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          OpenAI DALL-E 3
                        </button>
                        <button
                          onClick={() => setImageProvider('pollinations')}
                          aria-label="Select Free Flux provider"
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            imageProvider === 'pollinations' ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Free FLUX
                        </button>
                      </div>

                      <div className={`flex items-center gap-1 ${themeClasses.inputBg} px-2 py-1 rounded-xl border`}>
                        <span className="text-[11px] text-slate-400">Ratio:</span>
                        {(['1:1', '16:9', '9:16'] as const).map((r) => (
                          <button
                            key={r}
                            onClick={() => setImageAspectRatio(r)}
                            aria-label={`Select aspect ratio ${r}`}
                            className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                              imageAspectRatio === r ? 'bg-purple-950 text-purple-300 font-semibold border border-purple-500/40' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Replying to Message Preview Banner */}
                {replyingToMessage && (
                  <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-xs text-purple-200 shadow-md">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Reply className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <span className="truncate">
                        Replying to <strong className="text-purple-300">{replyingToMessage.role === 'USER' ? 'User' : 'SurajAI'}</strong>: "{replyingToMessage.content.slice(0, 80)}{replyingToMessage.content.length > 80 ? '...' : ''}"
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingToMessage(null)}
                      className="p-1 hover:bg-purple-900/60 rounded-lg text-purple-300 hover:text-white transition-colors"
                      aria-label="Cancel reply"
                      title="Cancel reply"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Floating Input Box */}
                <div className="floating-composer p-2.5 flex items-center gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileAttachment} className="hidden" multiple />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Attach File or Image"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-white/[0.06] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    title="Attach File / Image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsCameraOpen(true)}
                    aria-label="Open Camera"
                    className="p-2.5 rounded-xl text-slate-400 hover:text-purple-400 hover:bg-white/[0.06] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                    title="Open Camera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleListening}
                    aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                    className={`p-2.5 rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${isListening ? 'bg-rose-950 border border-rose-500/40 text-rose-400 animate-pulse' : 'text-slate-400 hover:text-purple-400 hover:bg-white/[0.06]'}`}
                    title="Voice Input (Speech-to-Text)"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  <div className="flex-1 flex items-center gap-1.5 min-w-0 bg-transparent">
                    <textarea
                      ref={composerInputRef}
                      rows={1}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        composerMode === 'image'
                          ? "Describe the image you want to create..."
                          : "Ask SurajAI anything..."
                      }
                      className="flex-1 p-2.5 bg-transparent text-sm resize-none focus:outline-none placeholder:text-slate-500 font-sans max-h-[200px] overflow-y-auto"
                    />

                    {inputMessage.trim().length > 0 && (
                      <div className="flex items-center gap-1 pr-1">
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(inputMessage)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-white/10 transition-colors"
                          title="Copy input text"
                          aria-label="Copy input text"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputMessage('')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Clear input text"
                          aria-label="Clear input text"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {isStreaming ? (
                    <button
                      onClick={handleStopGeneration}
                      aria-label="Stop generation"
                      className="w-10 h-10 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-medium transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                      title="Stop Generation"
                    >
                      <Square className="w-4 h-4 fill-white text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMessage.trim() && attachments.length === 0}
                      aria-label="Send message"
                      className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium disabled:opacity-40 transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center flex-shrink-0 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                      title="Send Message"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

