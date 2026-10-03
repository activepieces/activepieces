import { PlatformAnalyticsReport } from '@activepieces/shared';

function listFlowOwners({ flows, users }: FlowOwnersInput): Owner[] {
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

function listOwnerIdsMissingFromUsers({
  flows,
  users,
}: FlowOwnersInput): string[] {
  const userIds = new Set(users.map((user) => user.id));
  const missing = new Set<string>();
  flows.forEach(({ ownerId }) => {
    if (ownerId && !userIds.has(ownerId)) missing.add(ownerId);
  });
  return Array.from(missing);
}

export const impactOwnersUtils = {
  listFlowOwners,
  listOwnerIdsMissingFromUsers,
};

export type Owner = { id: string; name: string };

type FlowOwnersInput = {
  flows: Pick<PlatformAnalyticsReport['flows'][number], 'ownerId'>[];
  users: { id: string; firstName: string; lastName: string }[];
};
