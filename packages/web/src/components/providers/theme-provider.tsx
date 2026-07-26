import { createContext, useContext, useEffect, useState } from 'react';
import * as RippleHook from 'use-ripple-hook';

import { flagsHooks } from '@/hooks/flags-hooks';
import { colorsUtils } from '@/lib/color-utils';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ResolvedTheme = 'dark' | 'light';

type ThemeProviderState = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  forceLightMode: boolean;
  setForceLightMode: (value: boolean) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => null,
  forceLightMode: false,
  setForceLightMode: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

const prefersDarkMode = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const setFavicon = (url: string) => {
  document.querySelectorAll("link[rel*='icon']").forEach((el) => el.remove());
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = url;
  document.head.appendChild(link);
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ap-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme,
  );
  const [forceLightMode, setForceLightMode] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(prefersDarkMode);
  const branding = flagsHooks.useWebsiteBranding();

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (event: MediaQueryListEvent) =>
      setSystemPrefersDark(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = forceLightMode
    ? 'light'
    : theme === 'system'
    ? systemPrefersDark
      ? 'dark'
      : 'light'
    : theme;

  useEffect(() => {
    if (!branding) {
      console.warn('Website brand is not defined');
      return;
    }
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');
    document.title = branding.websiteName;
    document.documentElement.style.setProperty(
      '--primary',
      colorsUtils.hexToHslString(branding.colors.primary.default),
    );

    setFavicon(branding.logos.favIconUrl);
    switch (resolvedTheme) {
      case 'light': {
        document.documentElement.style.setProperty(
          '--primary-100',
          colorsUtils.hexToHslString(branding.colors.primary.light),
        );
        document.documentElement.style.setProperty(
          '--primary-300',
          colorsUtils.hexToHslString(branding.colors.primary.dark),
        );
        break;
      }
      case 'dark': {
        document.documentElement.style.setProperty(
          '--primary-100',
          colorsUtils.hexToHslString(branding.colors.primary.dark),
        );
        document.documentElement.style.setProperty(
          '--primary-300',
          colorsUtils.hexToHslString(branding.colors.primary.light),
        );
        break;
      }
      default:
        break;
    }

    root.classList.add(resolvedTheme);
  }, [resolvedTheme, branding]);

  const value = {
    theme,
    resolvedTheme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
    forceLightMode,
    setForceLightMode,
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
