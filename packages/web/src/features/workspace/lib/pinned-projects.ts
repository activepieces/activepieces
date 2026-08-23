import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type PinnedProjectsState = {
  pinnedIds: string[];
  /**
   * When true the sidebar lists every project instead of just pinned ones, so
   * users who want the classic projects-in-the-sidebar layout don't have to pin
   * one by one — and newly created projects show up automatically.
   */
  showAll: boolean;
  pin: (projectId: string) => void;
  unpin: (projectId: string) => void;
  toggle: (projectId: string) => void;
  setShowAll: (value: boolean) => void;
};

export const usePinnedProjects = create<PinnedProjectsState>()(
  persist(
    (set) => ({
      pinnedIds: [],
      showAll: false,
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
      setShowAll: (value) => set({ showAll: value }),
    }),
    { name: 'library-pinned-projects' },
  ),
);
