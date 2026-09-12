import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { apiRequest, setAccessToken } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session by checking HttpOnly cookie via /auth/refresh or demo session
  useEffect(() => {
    async function restoreSession() {
      try {
        const demoUser = localStorage.getItem('velozity_demo_user');
        const demoToken = localStorage.getItem('velozity_demo_token');
        if (demoUser && demoToken) {
          try {
            const parsed = JSON.parse(demoUser);
            setUser(parsed);
            setToken(demoToken);
            setAccessToken(demoToken);
            setIsLoading(false);
            return;
          } catch {
            // ignore
          }
        }

        const refreshUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/auth/refresh` : '/api/auth/refresh';
        const res = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('text/html')) {
            const json = await res.json();
            if (json.success && json.data) {
              setUser(json.data.user);
              setToken(json.data.accessToken);
              setAccessToken(json.data.accessToken);
            }
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    const data = await apiRequest<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
    setToken(data.accessToken);
    setAccessToken(data.accessToken);
    localStorage.setItem('velozity_demo_user', JSON.stringify(data.user));
    localStorage.setItem('velozity_demo_token', data.accessToken);
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // Proceed to clear state regardless of network response
    }
    localStorage.removeItem('velozity_demo_user');
    localStorage.removeItem('velozity_demo_token');
    setUser(null);
    setToken(null);
    setAccessToken(null);
  };

  const switchUser = async (email: string) => {
    await logout();
    await login(email, 'Password123!');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
