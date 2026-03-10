import { t } from 'i18next';
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { authenticationSession } from '@/lib/authentication-session';

const STORAGE_KEY_PREFIX = 'ap_pinned_items_';

function getStorageKey(projectId: string, userId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}_${userId}`;
}

/**
 * Stored as an ordered array where index 0 = most recently pinned (shown first).
 * New pins are prepended so "last pinned = very top".
 */
function readPinnedList(projectId: string, userId: string): string[] {
  try {
    const raw = localStorage.getItem(getStorageKey(projectId, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === 'object'
    ) {
      return [];
    }
    return parsed as string[];
  } catch {
    return [];
  }
}

function writePinnedList(
  projectId: string,
  userId: string,
  list: string[],
): void {
  localStorage.setItem(getStorageKey(projectId, userId), JSON.stringify(list));
}

export function usePinnedItems() {
  const { projectId: projectIdFromUrl } = useParams<{ projectId: string }>();
  const projectId = projectIdFromUrl ?? authenticationSession.getProjectId()!;
  const userId = authenticationSession.getCurrentUserId()!;

  const [pinnedList, setPinnedList] = useState<string[]>(() =>
    readPinnedList(projectId, userId),
  );

  const pinnedIds = new Set(pinnedList);

  const isPinned = useCallback(
    (itemId: string) => pinnedList.includes(itemId),
    [pinnedList],
  );

  const pinOrder = useCallback(
    (itemId: string) => {
      const idx = pinnedList.indexOf(itemId);
      return idx === -1 ? Infinity : idx;
    },
    [pinnedList],
  );

  const togglePin = useCallback(
    (itemId: string) => {
      const wasPinned = pinnedList.includes(itemId);
      setPinnedList((prev) => {
        const idx = prev.indexOf(itemId);
        let next: string[];
        if (idx !== -1) {
          next = prev.filter((id) => id !== itemId);
        } else {
          next = [itemId, ...prev];
        }
        writePinnedList(projectId, userId, next);
        return next;
      });
      if (wasPinned) {
        toast.success(t('Removed from favorites.'));
      } else {
        toast.success(t('Favorited and moved to the top.'));
      }
    },
    [projectId, userId, pinnedList],
  );

  const unpinItem = useCallback(
    (itemId: string) => {
      setPinnedList((prev) => {
        if (!prev.includes(itemId)) return prev;
        const next = prev.filter((id) => id !== itemId);
        writePinnedList(projectId, userId, next);
        return next;
      });
    },
    [projectId, userId],
  );

  return { pinnedIds, pinnedList, isPinned, pinOrder, togglePin, unpinItem };
}
