import { create } from 'zustand';

const STORAGE_KEY = 'primary-rail-collapsed';

function readInitial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

type RailCollapsedState = {
  collapsed: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
};

export const useRailCollapsed = create<RailCollapsedState>((set) => ({
  collapsed: readInitial(),
  setCollapsed: (value) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    set({ collapsed: value });
  },
  toggle: () =>
    set((state) => {
      const next = !state.collapsed;
      localStorage.setItem(STORAGE_KEY, String(next));
      return { collapsed: next };
    }),
}));
