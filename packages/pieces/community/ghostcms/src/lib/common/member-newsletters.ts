import { HttpMethod } from '@activepieces/pieces-common';
import { GhostAuthValue, ghostClient, ghostCommon } from './client';
import { ghostResource } from './resources';

export const currentNewsletterIds = async ({ auth, memberId }: { auth: GhostAuthValue; memberId: string }) => {
  const member = await ghostResource.get(auth, 'members', memberId);
  return ghostCommon
    .records(member['newsletters'])
    .map((newsletter) => newsletter['id'])
    .filter((id): id is string => typeof id === 'string');
};

export const saveNewsletters = async ({ auth, memberId, ids }: { auth: GhostAuthValue; memberId: string; ids: string[] }) =>
  ghostResource.edit(auth, 'members', memberId, {
    newsletters: ids.map((id) => ({ id })),
  });

export const requireIds = (value: unknown): string[] => {
  const ids = ghostCommon.stringList(value);
  if (!ids) {
    throw new Error('Provide at least one newsletter ID, from List Newsletters.');
  }
  return ids;
};

// Ghost wraps bulk stats in `bulk.meta` (core/server/api/endpoints/utils/serializers/output/members.js bulkAction).
type BulkUnsubscribeResponse = {
  bulk?: { meta?: { stats?: { unsuccessful?: number }; errors?: unknown[] } };
};

export const unsubscribeFromNewsletter = async ({
  auth,
  memberId,
  newsletterId,
}: {
  auth: GhostAuthValue;
  memberId: string;
  newsletterId: string;
}) => {
  const response = await ghostClient.request<BulkUnsubscribeResponse>({
    auth,
    method: HttpMethod.PUT,
    path: '/members/bulk',
    query: { filter: `id:${ghostCommon.nqlString(memberId)}` },
    body: { bulk: { action: 'unsubscribe', newsletter: newsletterId } },
  });
  if ((response.bulk?.meta?.stats?.unsuccessful ?? 0) > 0) {
    throw new Error(`Ghost could not remove the newsletter subscription: ${JSON.stringify(response.bulk?.meta?.errors ?? [])}`);
  }
};
