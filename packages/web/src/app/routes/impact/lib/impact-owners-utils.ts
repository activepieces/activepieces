import { PlatformAnalyticsReport } from '@activepieces/shared';

function listFlowOwners({
  flows,
  users,
}: Pick<PlatformAnalyticsReport, 'flows' | 'users'>): Owner[] {
  const usersById = new Map(users.map((user) => [user.id, user]));
  const owners = new Map<string, Owner>();
  flows.forEach(({ ownerId }) => {
    if (!ownerId || owners.has(ownerId)) return;
    const user = usersById.get(ownerId);
    owners.set(ownerId, {
      id: ownerId,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : ownerId,
    });
  });
  return Array.from(owners.values());
}

export type Owner = { id: string; name: string };

export const impactOwnersUtils = { listFlowOwners };
