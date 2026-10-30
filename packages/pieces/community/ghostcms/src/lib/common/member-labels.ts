import { HttpMethod } from '@activepieces/pieces-common';
import { GhostAuthValue, ghostClient, ghostCommon } from './client';
import { ghostResource } from './resources';

// Ghost wraps bulk stats in `bulk.meta` (core/server/api/endpoints/utils/serializers/output/members.js bulkAction).
type BulkResponse = {
  bulk?: { meta?: { stats?: { successful?: number; unsuccessful?: number }; errors?: unknown[] } };
};

export const changeMemberLabel = async ({
  auth,
  memberId,
  labelId,
  action,
}: {
  auth: GhostAuthValue;
  memberId: string;
  labelId: string;
  action: 'addLabel' | 'removeLabel';
}) => {
  const id = ghostCommon.id(memberId, 'Member ID');
  const label = (labelId ?? '').trim();
  if (!label) {
    throw new Error('Label ID is required.');
  }
  await ghostResource.get(auth, 'members', id);
  const response = await ghostClient.request<BulkResponse>({
    auth,
    method: HttpMethod.PUT,
    path: '/members/bulk',
    query: { filter: `id:${ghostCommon.nqlString(memberId.trim())}` },
    body: { bulk: { action, meta: { label: { id: label } } } },
  });
  const unsuccessful = response.bulk?.meta?.stats?.unsuccessful ?? 0;
  if (unsuccessful > 0) {
    throw new Error(`Ghost could not update the member label: ${JSON.stringify(response.bulk?.meta?.errors ?? [])}`);
  }
  return ghostResource.get(auth, 'members', id);
};
