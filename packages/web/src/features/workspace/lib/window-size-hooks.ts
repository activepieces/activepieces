import { useSyncExternalStore } from 'react';

function useWidth(): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth);
}

function useSize(): WindowSize {
  return useSyncExternalStore(subscribe, readSize);
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

function readSize(): WindowSize {
  const width = window.innerWidth;
  const height = window.innerHeight;
  if (size?.width !== width || size.height !== height) {
    size = { width, height };
  }
  return size;
}

let size: WindowSize | null = null;

export const windowSizeHooks = { useWidth, useSize, subscribe };

export type WindowSize = { width: number; height: number };
