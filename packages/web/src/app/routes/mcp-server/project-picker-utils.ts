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
          [getProjectName(project), project.id, project.externalId ?? '']
            .map((value) => value.toLowerCase())
            .some((value) => value.includes(query)),
        );
  const ordered = [
    ...matches.filter((project) => project.id === selectedId),
    ...matches.filter((project) => project.id !== selectedId),
  ];
  return { visible: ordered.slice(0, limit), total: matches.length };
}

function duplicateNames<T extends PickerProject>(projects: T[]): Set<string> {
  const counts = projects.reduce(
    (seen, project) =>
      seen.set(
        getProjectName(project),
        (seen.get(getProjectName(project)) ?? 0) + 1,
      ),
    new Map<string, number>(),
  );
  return new Set(
    [...counts].filter(([, count]) => count > 1).map(([name]) => name),
  );
}

export const projectPickerUtils = { filter, duplicateNames };

type PickerProject = Pick<
  ProjectWithLimits,
  'id' | 'type' | 'displayName' | 'externalId'
>;
