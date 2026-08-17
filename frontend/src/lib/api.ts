export function getBackendUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return envUrl || 'https://surajai-backend.onrender.com';
  }
  return envUrl || 'http://localhost:5000';
}

let refreshingPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    try {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('surajai_access_token') : null;
      const baseUrl = getBackendUrl();
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedToken }),
      });

      const json = await res.json().catch(() => ({}));
      if (json.success && json.data?.accessToken) {
        const newToken = json.data.accessToken;
        if (typeof window !== 'undefined') {
          localStorage.setItem('surajai_access_token', newToken);
        }
        return newToken;
      }
    } catch (err) {
      console.warn('Token refresh request failed:', err);
    } finally {
      refreshingPromise = null;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('surajai_access_token');
    }
    return null;
  })();

  return refreshingPromise;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}, retryCount = 0): Promise<any> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('surajai_access_token') : null;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const baseUrl = getBackendUrl();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const json = await res.json().catch(() => ({}));

    if (res.status === 401 || (!json.success && json.error?.code === 'INVALID_TOKEN')) {
      if (retryCount === 0) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          return fetchWithAuth(endpoint, options, retryCount + 1);
        }
      }
      if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.dispatchEvent(new CustomEvent('surajai_auth_expired'));
      }
      throw new Error(json.error?.message || 'Invalid or expired authentication token.');
    }

    if (!json.success) {
      throw new Error(json.error?.message || 'API Request Failed');
    }

    return json.data;
  } catch (err: any) {
    if ((err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) && retryCount < 4) {
      await new Promise((r) => setTimeout(r, 1200 * (retryCount + 1)));
      return fetchWithAuth(endpoint, options, retryCount + 1);
    }
    throw err;
  }
}

export async function streamChatResponse(
  endpoint: string,
  body: { conversationId?: string; message: string; model?: string; attachments?: any[] },
  onChunk: (chunkEvent: any) => void,
  signal?: AbortSignal,
  retryCount = 0
): Promise<{ conversationId?: string; fullText: string }> {
  let token = typeof window !== 'undefined' ? localStorage.getItem('surajai_access_token') : null;
  const baseUrl = getBackendUrl();

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  });

  if (res.status === 401) {
    if (retryCount === 0) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return streamChatResponse(endpoint, body, onChunk, signal, retryCount + 1);
      }
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.dispatchEvent(new CustomEvent('surajai_auth_expired'));
    }
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || 'Invalid or expired authentication token.');
  }

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error?.message || `HTTP error! status: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let fullText = '';
  let conversationId: string | undefined = body.conversationId;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;

        try {
          const chunkEvent = JSON.parse(dataStr);
          if (chunkEvent.type === 'metadata' && chunkEvent.conversationId) {
            conversationId = chunkEvent.conversationId;
          } else if (chunkEvent.type === 'text_delta' && chunkEvent.content) {
            fullText += chunkEvent.content;
          }
          onChunk(chunkEvent);
        } catch (err) {
          console.warn('Failed to parse SSE line:', dataStr, err);
        }
      }
    }
  }

  return { conversationId, fullText };
}

// Conversation Management API Helpers
export async function getConversations() {
  return fetchWithAuth('/api/conversations');
}

export async function getConversation(id: string) {
  return fetchWithAuth(`/api/conversations/${id}`);
}

export async function deleteConversation(id: string) {
  return fetchWithAuth(`/api/conversations/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkDeleteConversations(ids: string[]) {
  return fetchWithAuth('/api/conversations/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function deleteAllConversations() {
  return fetchWithAuth('/api/conversations/all', {
    method: 'DELETE',
  });
}

export async function updateConversationTitle(id: string, title: string) {
  return fetchWithAuth(`/api/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function togglePinConversation(id: string) {
  return fetchWithAuth(`/api/conversations/${id}/pin`, {
    method: 'PATCH',
  });
}

export async function toggleArchiveConversation(id: string) {
  return fetchWithAuth(`/api/conversations/${id}/archive`, {
    method: 'PATCH',
  });
}

export async function exportConversation(id: string, format: 'json' | 'markdown' | 'txt' = 'json') {
  return fetchWithAuth(`/api/conversations/${id}/export?format=${format}`);
}

export async function editMessage(id: string, content: string) {
  return fetchWithAuth(`/api/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  });
}

export async function deleteMessage(id: string) {
  return fetchWithAuth(`/api/messages/${id}`, {
    method: 'DELETE',
  });
}

// Image Generation Studio APIs
export async function generateImage(prompt: string, aspectRatio = '1:1', model = 'flux', conversationId?: string, provider = 'openai') {
  return fetchWithAuth('/api/images/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, aspectRatio, model, conversationId, provider }),
  });
}

export async function getGeneratedImages(page = 1, limit = 20) {
  return fetchWithAuth(`/api/images?page=${page}&limit=${limit}`);
}

export async function downloadImage(id: string) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('surajai_access_token') : null;
  const baseUrl = getBackendUrl();
  const res = await fetch(`${baseUrl}/api/images/${id}/download`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Image download failed');
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `surajai_gen_${id}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function deleteImage(id: string) {
  return fetchWithAuth(`/api/images/${id}`, {
    method: 'DELETE',
  });
}

export async function bulkDeleteImages(ids: string[]) {
  return fetchWithAuth('/api/images/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export async function regenerateImage(id: string) {
  return fetchWithAuth(`/api/images/${id}/regenerate`, {
    method: 'POST',
  });
}

export async function editImagePrompt(id: string, prompt: string) {
  return fetchWithAuth(`/api/images/${id}/edit`, {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

// Session & Profile Helpers
export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return fetchWithAuth('/api/users/me/avatar', {
    method: 'POST',
    body: formData,
  });
}

export async function getActiveSessions() {
  return fetchWithAuth('/api/users/me/sessions');
}

export async function revokeSession(id: string) {
  return fetchWithAuth(`/api/users/me/sessions/${id}`, {
    method: 'DELETE',
  });
}

export async function revokeOtherSessions() {
  return fetchWithAuth('/api/users/me/sessions/other', {
    method: 'DELETE',
  });
}
