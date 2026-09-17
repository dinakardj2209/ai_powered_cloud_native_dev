import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { UserProfile, AuthResponse } from '@devflow/shared';
import { api } from '@/lib/api';

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    api.loadTokens();
    const token = api.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const profile = await api.get<UserProfile>('/auth/me');
      setUser(profile);
    } catch {
      api.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const result = await api.post<AuthResponse>('/auth/login', { email, password });
    api.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setUser(result.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const result = await api.post<AuthResponse>('/auth/register', {
      name,
      email,
      password,
    });
    api.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    setUser(result.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('devflow_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Continue logout even if API call fails
    }
    api.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
