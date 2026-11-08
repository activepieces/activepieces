import { useSyncExternalStore } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

export function useSessionProjectId(): string | null {
  return useSyncExternalStore(authenticationSession.subscribe, readProjectId);
}

function readProjectId(): string | null {
  return authenticationSession.getTabProjectId();
}
