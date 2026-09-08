import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { login as apiLogin } from '../api/endpoints';

interface AuthState {
  username: string | null;
  roles: string[];
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function loadStoredUser(): { username: string; roles: string[] } | null {
  const raw = localStorage.getItem('cslm_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState(loadStoredUser());

  const value = useMemo<AuthState>(
    () => ({
      username: user?.username ?? null,
      roles: user?.roles ?? [],
      isAuthenticated: !!user,
      hasRole: (...roles: string[]) => !!user && roles.some((r) => user.roles.includes(r)),
      login: async (username: string, password: string) => {
        const response = await apiLogin(username, password);
        localStorage.setItem('cslm_token', response.token);
        localStorage.setItem('cslm_user', JSON.stringify({ username: response.username, roles: response.roles }));
        setUser({ username: response.username, roles: response.roles });
      },
      logout: () => {
        localStorage.removeItem('cslm_token');
        localStorage.removeItem('cslm_user');
        setUser(null);
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
