function projectToKeep<T extends { id: string }>({
  selectedProjects,
  defaultProjectIds,
  autoCreatePersonalProjects,
}: ProjectToKeepParams<T>): T | undefined {
  if (autoCreatePersonalProjects || defaultProjectIds.length === 0) {
    return undefined;
  }
  const selectedIds = new Set(selectedProjects.map((project) => project.id));
  const removesEveryDefault = defaultProjectIds.every((id) =>
    selectedIds.has(id),
  );
  if (!removesEveryDefault) {
    return undefined;
  }
  return selectedProjects.find(
    (project) => project.id === defaultProjectIds[0],
  );
}

export const defaultProjectGuard = {
  projectToKeep,
};

type ProjectToKeepParams<T> = {
  selectedProjects: T[];
  defaultProjectIds: string[];
  autoCreatePersonalProjects: boolean;
};
