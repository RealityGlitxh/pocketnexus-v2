import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';
const STORAGE_KEY = 'pn.theme';

function readStored(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'light' || v === 'system' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

function resolve(pref: ThemePreference): 'dark' | 'light' {
  if (pref !== 'system') return pref;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPref] = useState<ThemePreference>(readStored);

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolve(preference);
    };
    apply();
    if (preference !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
    };
  }, [preference]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPref(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* storage unavailable (private mode): preference lasts for this session */
    }
  }, []);

  const value = useMemo(() => ({ preference, setPreference }), [preference, setPreference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return ctx;
}
