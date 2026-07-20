import { useCallback, useState } from 'react';

export function useBrowseNavigation(
  activeProjectId: string,
  initial?: {
    category?: BrowseCategory;
    filter?: ProjectFilter;
    projectId?: string;
  },
) {
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? activeProjectId,
  );
  const [category, setCategory] = useState<BrowseCategory>(
    initial?.category ?? 'recent',
  );
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>(
    initial?.filter ?? 'all',
  );

  const selectProject = useCallback(
    (id: string, nextCategory?: BrowseCategory) => {
      setProjectId(id);
      if (nextCategory) setCategory(nextCategory);
    },
    [],
  );

  const selectCategory = useCallback((next: BrowseCategory) => {
    setCategory(next);
  }, []);

  const selectProjectFilter = useCallback((next: ProjectFilter) => {
    setProjectFilter(next);
  }, []);

  const reset = useCallback(() => {
    setProjectId(activeProjectId);
    setCategory('recent');
    setProjectFilter('all');
  }, [activeProjectId]);

  return {
    projectId,
    category,
    projectFilter,
    selectProject,
    selectCategory,
    selectProjectFilter,
    reset,
  };
}

export type BrowseCategory = 'recent' | 'project';
export type ProjectFilter = 'all' | 'flows' | 'tables';
