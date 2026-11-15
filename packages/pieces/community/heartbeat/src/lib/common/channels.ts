import { HttpMethod } from '@activepieces/pieces-common';
import { heartbeatApi } from './client';

async function listChannels({ token }: { token: string }): Promise<Record<string, unknown>[]> {
  return heartbeatApi.recordList(
    await heartbeatApi.request<unknown>({ token, method: HttpMethod.GET, path: '/channels', operation: 'list channels' }),
  );
}

async function findChannel({ token, channelId }: { token: string; channelId: string }): Promise<Record<string, unknown> | null> {
  const channels = await listChannels({ token });
  return channels.find((channel) => channel['id'] === channelId) ?? null;
}

export const heartbeatChannels = {
  listChannels,
  findChannel,
};
