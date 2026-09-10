import { create } from 'zustand';

const STORAGE_KEY = 'primary-rail-collapsed';

function readInitial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

function persist(value: boolean): boolean {
  localStorage.setItem(STORAGE_KEY, String(value));
  return value;
}

export const useRailCollapsed = create<RailCollapsedState>((set) => ({
  preference: readInitial(),
  heldClosed: false,
  setCollapsed: (value) =>
    set({ preference: persist(value), heldClosed: false }),
  toggle: () =>
    set((state) => ({
      preference: persist(!railIsCollapsed(state)),
      heldClosed: false,
    })),
  holdClosed: (value) => set({ heldClosed: value }),
}));

export function railIsCollapsed({
  preference,
  heldClosed,
}: {
  preference: boolean;
  heldClosed: boolean;
}): boolean {
  return preference || heldClosed;
}

type RailCollapsedState = {
  preference: boolean;
  heldClosed: boolean;
  setCollapsed: (value: boolean) => void;
  toggle: () => void;
  holdClosed: (value: boolean) => void;
};
