import { useEffect, useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { healthQueries } from '../hooks/health-hooks';

export const useSecurityAdvisoryStore = create<StoreState>()(
  persist(
    (set) => ({
      dismissedIds: [],
      markSeen: (ids) =>
        set((state) => ({
          dismissedIds: Array.from(new Set([...state.dismissedIds, ...ids])),
        })),
      markDismissed: (ids) =>
        set((state) => ({
          dismissedIds: Array.from(new Set([...state.dismissedIds, ...ids])),
        })),
      pruneToLive: (liveIds) =>
        set((state) => {
          const live = new Set(liveIds);
          return {
            dismissedIds: state.dismissedIds.filter((id) => live.has(id)),
          };
        }),
    }),
    { name: 'ap_security_advisory_state' },
  ),
);

export const useUnseenSecurityAdvisories = () => {
  const { data } = healthQueries.useSecurityAdvisories();
  const pruneToLive = useSecurityAdvisoryStore((s) => s.pruneToLive);

  useEffect(() => {
    if (!data) return;
    pruneToLive(data.advisories.map((a) => a.id));
  }, [data, pruneToLive]);

  return useMemo(
    () =>
      (data?.advisories ?? []).filter(
        (a) => a.severity === 'high' || a.severity === 'critical',
      ),
    [data],
  );
};

type StoreState = {
  dismissedIds: string[];
  markSeen: (ids: string[]) => void;
  markDismissed: (ids: string[]) => void;
  pruneToLive: (liveIds: string[]) => void;
};
