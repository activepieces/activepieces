import { useCallback, useState } from 'react';

import { authenticationSession } from '@/lib/authentication-session';

const STORAGE_KEY_PREFIX = 'ap_browse_prefs_';

export function useUiPreferences(): {
  prefs: UiPreferences;
  update: (partial: Partial<UiPreferences>) => void;
} {
  const userId = authenticationSession.getCurrentUserId() ?? 'anonymous';
  const [prefs, setPrefs] = useState<UiPreferences>(() => readPrefs(userId));

  const update = useCallback(
    (partial: Partial<UiPreferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial };
        localStorage.setItem(getStorageKey(userId), JSON.stringify(next));
        return next;
      });
    },
    [userId],
  );

  return { prefs, update };
}

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function readPrefs(userId: string): UiPreferences {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(getStorageKey(userId)) ?? '{}',
    );
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export type UiPreferences = {
  browseScope?: 'recent' | 'project';
  browseFilter?: 'all' | 'flows' | 'tables';
  browseProjectId?: string;
};
