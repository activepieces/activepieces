import { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

import { authenticationSession } from '@/lib/authentication-session';

export function useSessionProjectId(): string | null {
  const { pathname } = useLocation();
  const storedProjectId = useSyncExternalStore(
    authenticationSession.subscribe,
    authenticationSession.getStoredProjectId,
  );
  return authenticationSession.projectIdFor({ pathname, storedProjectId });
}
