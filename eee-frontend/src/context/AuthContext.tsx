import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authAPI, setAccessToken } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, access: string, refresh?: string) => void;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateToken = (newToken: string | null) => {
    setTokenState(newToken);
    setAccessToken(newToken);
  };

  useEffect(() => {
    // Perform silent token refresh on mount using HttpOnly cookie
    const initAuth = async () => {
      try {
        const refreshRes = await authAPI.refreshToken();
        const access = refreshRes.data.access;
        updateToken(access);

        const profileRes = await authAPI.getProfile();
        setUser(profileRes.data);
      } catch {
        // Silent refresh failed (no active cookie/session)
        updateToken(null);
        setUser(null);
      } finally {
        // Clean legacy storage keys if present
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('refresh_token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (userData: User, access: string, _refresh?: string) => {
    updateToken(access);
    setUser(userData);

    sessionStorage.removeItem(`eee_assessment_prompted_${userData.id}`);

    // Clean legacy storage keys
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  };

  const logout = async () => {
    if (user?.id) {
      sessionStorage.removeItem(`eee_assessment_prompted_${user.id}`);
    }

    try {
      await authAPI.logout();
    } catch {
      // Ignore network errors during logout
    } finally {
      updateToken(null);
      setUser(null);

      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, logout,
      isAdmin: user?.role === 'admin',
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
