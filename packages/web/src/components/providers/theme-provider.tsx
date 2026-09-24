import { brandColors } from '@activepieces/shared';
import { createContext, useContext, useEffect, useState } from 'react';
import * as RippleHook from 'use-ripple-hook';

import { flagsHooks } from '@/hooks/flags-hooks';

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(
  undefined,
);

const systemThemeQuery = '(prefers-color-scheme: dark)';

export function ThemeProvider({
  children,
  defaultPreference = 'light',
  storageKey = 'ap-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [preference, setPreference] = useState<ThemePreference>(
    () =>
      (localStorage.getItem(storageKey) as ThemePreference) ||
      defaultPreference,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);
  const branding = flagsHooks.useWebsiteBranding();

  const resolvedTheme: ResolvedTheme =
    preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    const mediaQuery = window.matchMedia(systemThemeQuery);
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (!branding) {
      console.warn('Website brand is not defined');
      return;
    }
    document.title = branding.websiteName;
    setFavicon(branding.logos.favIconUrl);

    const variables = brandColors.cssVariables({
      primaryColor: branding.colors.primary.default,
      theme: resolvedTheme,
    });
    Object.entries(variables).forEach(([name, value]) => {
      document.documentElement.style.setProperty(name, value);
    });
  }, [branding, resolvedTheme]);

  const value = {
    preference,
    resolvedTheme,
    setPreference: (next: ThemePreference) => {
      localStorage.setItem(storageKey, next);
      setPreference(next);
    },
    setPreferenceWithoutPersisting: setPreference,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

export const useApRipple = () => {
  const { resolvedTheme } = useTheme();
  return RippleHook.default({
    color:
      resolvedTheme === 'dark'
        ? 'rgba(233, 233, 233, 0.2)'
        : 'rgba(155, 155, 155, 0.2)',
    cancelAutomatically: true,
  });
};

const setFavicon = (url: string) => {
  document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
};

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia(systemThemeQuery).matches ? 'dark' : 'light';

export type ThemePreference = 'dark' | 'light' | 'system';

export type ResolvedTheme = 'dark' | 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultPreference?: ThemePreference;
  storageKey?: string;
};

type ThemeProviderState = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
  setPreferenceWithoutPersisting: (preference: ThemePreference) => void;
};
