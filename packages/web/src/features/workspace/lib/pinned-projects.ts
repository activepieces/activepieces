import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PinnedProjectsState = {
  pinnedIds: string[];
  pin: (projectId: string) => void;
  unpin: (projectId: string) => void;
  toggle: (projectId: string) => void;
};

export const usePinnedProjects = create<PinnedProjectsState>()(
  persist(
    (set) => ({
      pinnedIds: [],
      pin: (projectId) =>
        set((state) =>
          state.pinnedIds.includes(projectId)
            ? state
            : { pinnedIds: [...state.pinnedIds, projectId] },
        ),
      unpin: (projectId) =>
        set((state) => ({
          pinnedIds: state.pinnedIds.filter((id) => id !== projectId),
        })),
      toggle: (projectId) =>
        set((state) =>
          state.pinnedIds.includes(projectId)
            ? { pinnedIds: state.pinnedIds.filter((id) => id !== projectId) }
            : { pinnedIds: [...state.pinnedIds, projectId] },
        ),
    }),
    { name: 'library-pinned-projects' },
  ),
);
