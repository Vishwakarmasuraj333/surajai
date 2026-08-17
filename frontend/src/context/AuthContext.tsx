'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { refreshAccessToken } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  avatar: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (user: User, token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

async function fetchWithRetry(url: string, options: RequestInit, retries = 5, delay = 1000): Promise<Response | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err: any) {
      if (i === retries - 1) return null;
      await new Promise((r) => setTimeout(r, delay * Math.pow(1.3, i)));
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Listen for global auth expiration events from fetchWithAuth
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('surajai_access_token');
      if (pathname !== '/login' && pathname !== '/register') {
        router.push('/login');
      }
    };

    window.addEventListener('surajai_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('surajai_auth_expired', handleAuthExpired);
    };
  }, [router, pathname]);

  // Load current user on initial application startup
  useEffect(() => {
    async function loadUser() {
      try {
        let storedToken = localStorage.getItem('surajai_access_token');
        if (!storedToken) {
          storedToken = await refreshAccessToken();
        }

        if (storedToken) {
          setAccessToken(storedToken);
          let res = await fetchWithRetry(`${API_BASE}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
            credentials: 'include',
          });

          if (!res) {
            setLoading(false);
            return;
          }

          let json = await res.json().catch(() => ({}));
          
          if (!json.success && (res.status === 401 || json.error?.code === 'INVALID_TOKEN')) {
            const newToken = await refreshAccessToken();
            if (newToken) {
              storedToken = newToken;
              setAccessToken(newToken);
              res = await fetchWithRetry(`${API_BASE}/api/auth/me`, {
                headers: {
                  Authorization: `Bearer ${newToken}`,
                },
                credentials: 'include',
              });
              if (res) {
                json = await res.json().catch(() => ({}));
              }
            }
          }

          if (json.success && json.data?.user) {
            setUser(json.data.user);
          } else {
            localStorage.removeItem('surajai_access_token');
            setUser(null);
            setAccessToken(null);
          }
        }
      } catch (err) {
        console.warn('Silent loadUser notice:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
    } catch (err) {
      throw new Error('Unable to connect to SurajAI backend server. Please verify backend server is running.');
    }

    const json = await res.json().catch(() => ({}));

    if (!json.success) {
      throw new Error(json.error?.message || 'Login failed.');
    }

    const { user: userData, accessToken: token } = json.data;
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('surajai_access_token', token);
    router.push('/workspace');
  };

  const loginWithGoogle = async (credential: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });
    } catch (err) {
      throw new Error('Unable to connect to SurajAI backend server. Please verify backend server is running.');
    }

    const json = await res.json().catch(() => ({}));

    if (!json.success) {
      throw new Error(json.error?.message || 'Google OAuth Sign-In failed.');
    }

    const { user: userData, accessToken: token } = json.data;
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('surajai_access_token', token);
    router.push('/workspace');
  };

  const register = async (name: string, email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });
    } catch (err) {
      throw new Error('Unable to connect to SurajAI backend server. Please verify backend server is running.');
    }

    const json = await res.json().catch(() => ({}));

    if (!json.success) {
      throw new Error(json.error?.message || 'Registration failed.');
    }

    const { user: userData, accessToken: token } = json.data;
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('surajai_access_token', token);
    router.push('/workspace');
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
        });
      }
    } catch (err) {
      console.error('Logout request failed:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('surajai_access_token');
      router.push('/login');
    }
  };

  const setSession = (userData: User, token: string) => {
    setUser(userData);
    setAccessToken(token);
    localStorage.setItem('surajai_access_token', token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        accessToken,
        login,
        loginWithGoogle,
        register,
        logout,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
