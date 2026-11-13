function stringIds({
  value,
  propName,
}: {
  value: unknown[] | undefined;
  propName: string;
}): string[] {
  const ids = value ?? [];
  if (!ids.every((id): id is string => typeof id === 'string' && id !== '')) {
    throw new Error(`${propName} must be a list of non-empty ID strings.`);
  }
  return ids;
}

function assignmentsFor({ userIds }: { userIds: string[] }) {
  return Object.fromEntries(
    userIds.map((userId) => [
      userId,
      {
        '@odata.type': '#microsoft.graph.plannerAssignment',
        orderHint: ' !',
      },
    ])
  );
}

export const microsoft365PlannerUtils = { stringIds, assignmentsFor };
