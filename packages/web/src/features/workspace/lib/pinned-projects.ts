import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePinnedProjects = create<PinnedProjectsState>()(
  persist(
    (set) => ({
      pinnedProjectId: null,
      pin: (projectId) => set({ pinnedProjectId: projectId }),
      unpin: () => set({ pinnedProjectId: null }),
      toggle: (projectId) =>
        set((state) => ({
          pinnedProjectId:
            state.pinnedProjectId === projectId ? null : projectId,
        })),
    }),
    {
      name: 'library-pinned-project',
      partialize: (state) => ({ pinnedProjectId: state.pinnedProjectId }),
    },
  ),
);

type PinnedProjectsState = {
  pinnedProjectId: string | null;
  pin: (projectId: string) => void;
  unpin: () => void;
  toggle: (projectId: string) => void;
};
