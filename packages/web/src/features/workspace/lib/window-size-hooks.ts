import { useSyncExternalStore } from 'react';

import { MOBILE_BREAKPOINT } from '@/hooks/use-mobile';

function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth);
}

function useIsPhone(): boolean {
  return useSyncExternalStore(subscribe, isPhone);
}

function isPhone(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

function subscribe(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

export const windowSizeHooks = {
  useViewportWidth,
  useIsPhone,
  isPhone,
  subscribe,
};
