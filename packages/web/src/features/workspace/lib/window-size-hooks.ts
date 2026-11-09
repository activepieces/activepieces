import { useSyncExternalStore } from 'react';

function useWidth(): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth);
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

export const windowSizeHooks = { useWidth, subscribe };
