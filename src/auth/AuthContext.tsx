import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ApiClient } from '../api/client';
import type { LoginResponse, UserResponse } from '../api/types';
import { API_BASE_URL } from '../config/env';

interface StoredUserSession {
  mode?: 'user';
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface StoredGuestSession {
  mode: 'guest';
}

type StoredSession = StoredUserSession | StoredGuestSession;

interface AuthContextValue {
  api: ApiClient;
  user: UserResponse | LoginResponse['user'] | null;
  ready: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  continueAsGuest: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const STORAGE_KEY = 'sitdown.session';
const GUEST_USER: LoginResponse['user'] = {
  id: 'guest',
  email: 'guest@sitdown.local',
  name: '게스트',
  role: 'GUEST',
};

let currentAccessToken: string | null = accessTokenFromSession(readStoredSession());
const api = new ApiClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () => currentAccessToken,
});

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession());
  const [user, setUser] = useState<UserResponse | LoginResponse['user'] | null>(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    currentAccessToken = null;
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (session?.mode === 'guest') {
      setUser(GUEST_USER);
      setReady(true);
      return;
    }

    if (!currentAccessToken) {
      setReady(true);
      return;
    }

    try {
      setUser(await api.getMe());
    } finally {
      setReady(true);
    }
  }, [session]);

  useEffect(() => {
    currentAccessToken = accessTokenFromSession(session);
  }, [session]);

  useEffect(() => {
    api.setUnauthorizedHandler(clearSession);
  }, [clearSession]);

  useEffect(() => {
    void refreshUser().catch(() => {
      clearSession();
      setReady(true);
    });
  }, [clearSession, refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    const nextSession = {
      mode: 'user' as const,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresIn: response.accessTokenExpiresIn,
    };

    currentAccessToken = response.accessToken;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setUser(response.user);
  }, []);

  const continueAsGuest = useCallback(() => {
    const nextSession: StoredGuestSession = { mode: 'guest' };
    currentAccessToken = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setUser(GUEST_USER);
    setReady(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      if (currentAccessToken) {
        await api.logout();
      }
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    api,
    user,
    ready,
    isAuthenticated: Boolean(session),
    isGuest: session?.mode === 'guest',
    continueAsGuest,
    login,
    logout,
    refreshUser,
  }), [continueAsGuest, login, logout, ready, refreshUser, session, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function accessTokenFromSession(session: StoredSession | null): string | null {
  if (!session || session.mode === 'guest') {
    return null;
  }

  return session.accessToken;
}
