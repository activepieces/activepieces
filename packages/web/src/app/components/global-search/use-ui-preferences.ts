import {
  type UiPreferences,
  type UserWithMetaInformation,
} from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { userApi } from '@/api/user-api';
import { userHooks } from '@/hooks/user-hooks';
import { authenticationSession } from '@/lib/authentication-session';

const DEBOUNCE_MS = 600;

export function useUiPreferences(): {
  prefs: UiPreferences;
  update: (
    partial: Partial<UiPreferences>,
    options?: { immediate?: boolean },
  ) => void;
} {
  const queryClient = useQueryClient();
  const { data: user } = userHooks.useCurrentUser();
  const userId = authenticationSession.getCurrentUserId();
  const prefs: UiPreferences = user?.uiPreferences ?? {};
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Accumulates the unsent partial across debounced calls so no key is lost;
  // the server merges it into the stored value (DB is the source of truth).
  const pendingRef = useRef<Partial<UiPreferences>>({});

  const update = useCallback(
    (partial: Partial<UiPreferences>, options?: { immediate?: boolean }) => {
      const key = ['currentUser', userId];
      const current =
        queryClient.getQueryData<UserWithMetaInformation | null>(key)
          ?.uiPreferences ?? {};
      queryClient.setQueryData<UserWithMetaInformation | null>(key, (old) =>
        old ? { ...old, uiPreferences: { ...current, ...partial } } : old,
      );
      pendingRef.current = { ...pendingRef.current, ...partial };
      const flush = () => {
        const body = pendingRef.current;
        pendingRef.current = {};
        if (Object.keys(body).length > 0) {
          userApi.updateUiPreferences(body).catch(() => undefined);
        }
      };
      if (timerRef.current) clearTimeout(timerRef.current);
      if (options?.immediate) {
        flush();
      } else {
        timerRef.current = setTimeout(flush, DEBOUNCE_MS);
      }
    },
    [queryClient, userId],
  );

  return { prefs, update };
}
