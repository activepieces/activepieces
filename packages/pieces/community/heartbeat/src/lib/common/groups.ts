import { HttpMethod } from '@activepieces/pieces-common';
import { heartbeatApi } from './client';

async function getGroup({ token, groupId }: { token: string; groupId: string }): Promise<Record<string, unknown>> {
  return heartbeatApi.request<Record<string, unknown>>({
    token,
    method: HttpMethod.GET,
    path: `/groups/${groupId}`,
    operation: 'get group',
  });
}

function memberEmails(group: Record<string, unknown>): Set<string> {
  return new Set(
    heartbeatApi
      .recordList(group['users'])
      .flatMap((user) => (typeof user['email'] === 'string' ? [user['email'].toLowerCase()] : [])),
  );
}

export const heartbeatGroups = {
  getGroup,
  memberEmails,
};
