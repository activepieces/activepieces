import { useCallback, useState } from 'react';

export function useBrowseNavigation(activeProjectId: string) {
  const [projectId, setProjectId] = useState(activeProjectId);
  const [category, setCategory] = useState<BrowseCategory>('recent');
  const [projectFilter, setProjectFilter] = useState<ProjectFilter>('all');

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
export type ProjectFilter = 'all' | 'flows' | 'tables' | 'active';
