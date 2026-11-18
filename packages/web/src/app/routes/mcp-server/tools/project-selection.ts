import { isNil } from '@activepieces/shared';

function resolveSelected({
  projectId,
  reachableProjectIds,
}: {
  projectId: string | null;
  reachableProjectIds: string[] | null;
}): string | null {
  if (isNil(reachableProjectIds) || reachableProjectIds.length === 0) {
    return projectId;
  }
  if (!isNil(projectId) && reachableProjectIds.includes(projectId)) {
    return projectId;
  }
  return reachableProjectIds[0];
}

export const reachableProjectUtils = { resolveSelected };
