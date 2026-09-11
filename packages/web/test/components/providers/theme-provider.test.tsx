/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: {
    useWebsiteBranding: () => ({
      websiteName: 'Test',
      logos: { fullLogoUrl: '', favIconUrl: '', logoIconUrl: '' },
      colors: {
        avatar: '#000000',
        'blue-link': '#000000',
        danger: '#000000',
        selection: '#000000',
        primary: {
          default: '#111111',
          dark: '#222222',
          light: '#333333',
          medium: '#444444',
        },
        warn: { default: '#000000', light: '#000000', dark: '#000000' },
        success: { default: '#000000', light: '#000000' },
      },
    }),
  },
}));

import { ThemeProvider } from '@/components/providers/theme-provider';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const listeners = new Set<(event: { matches: boolean }) => void>();
let systemPrefersDark = false;

const matchMedia = vi.fn((query: string) => ({
  matches: systemPrefersDark,
  media: query,
  onchange: null,
  addEventListener: (
    _type: string,
    listener: (event: { matches: boolean }) => void,
  ) => {
    listeners.add(listener);
  },
  removeEventListener: (
    _type: string,
    listener: (event: { matches: boolean }) => void,
  ) => {
    listeners.delete(listener);
  },
  addListener: (listener: (event: { matches: boolean }) => void) => {
    listeners.add(listener);
  },
  removeListener: (listener: (event: { matches: boolean }) => void) => {
    listeners.delete(listener);
  },
  dispatchEvent: () => true,
}));

const emitSystemThemeChange = (matches: boolean) => {
  systemPrefersDark = matches;
  listeners.forEach((listener) => listener({ matches }));
};

describe('ThemeProvider system theme', () => {
  let root: Root | undefined;

  beforeEach(() => {
    listeners.clear();
    systemPrefersDark = false;
    localStorage.clear();
    vi.stubGlobal('matchMedia', matchMedia);
  });

  afterEach(() => {
    act(() => root?.unmount());
    root = undefined;
    document.body.innerHTML = '';
    document.documentElement.className = '';
    vi.unstubAllGlobals();
  });

  const mount = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    const current = root;
    act(() => {
      current.render(
        <ThemeProvider storageKey="test-theme">
          <div />
        </ThemeProvider>,
      );
    });
  };

  it('uses the OS preference when the theme is system', () => {
    mount();
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reacts to the OS switching between light and dark', () => {
    mount();

    act(() => emitSystemThemeChange(true));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);

    act(() => emitSystemThemeChange(false));
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});