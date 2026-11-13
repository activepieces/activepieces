import { HttpMethod } from '@activepieces/pieces-common';
import { heartbeatApi } from './client';

async function getEvent({ token, eventId }: { token: string; eventId: string }): Promise<Record<string, unknown>> {
  return heartbeatApi.request<Record<string, unknown>>({
    token,
    method: HttpMethod.GET,
    path: `/events/${eventId}`,
    operation: 'get event',
  });
}

export const heartbeatEvents = {
  getEvent,
};
