import { useSyncExternalStore } from 'react';

import { MOBILE_BREAKPOINT } from '@/hooks/use-mobile';

// Only for sizing that follows every pixel, like the docked chat's width.
function useViewportWidth(): number {
  return useSyncExternalStore(subscribe, () => window.innerWidth);
}

// Re-renders only when the window crosses the phone breakpoint.
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
