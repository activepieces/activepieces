import { ProjectWithLimits } from '@activepieces/shared';

import { getProjectName } from '@/features/projects';

function filter<T extends PickerProject>({
  projects,
  search,
  selectedId,
  limit,
}: {
  projects: T[];
  search: string;
  selectedId: string | null;
  limit: number;
}): { visible: T[]; total: number } {
  const query = search.trim().toLowerCase();
  const matches =
    query === ''
      ? projects
      : projects.filter((project) =>
          getProjectName(project).toLowerCase().includes(query),
        );
  const ordered = [
    ...matches.filter((project) => project.id === selectedId),
    ...matches.filter((project) => project.id !== selectedId),
  ];
  return { visible: ordered.slice(0, limit), total: matches.length };
}

export const projectPickerUtils = { filter };

type PickerProject = Pick<ProjectWithLimits, 'id' | 'type' | 'displayName'>;
