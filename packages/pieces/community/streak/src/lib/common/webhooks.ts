import { HttpMethod } from '@activepieces/pieces-common';
import { streakApiCall } from './client';
import { StreakWebhook } from './types';

export async function createPipelineWebhook({
  apiKey,
  pipelineKey,
  event,
  targetUrl,
}: {
  apiKey: string;
  pipelineKey: string;
  event: string;
  targetUrl: string;
}): Promise<StreakWebhook> {
  const response = await streakApiCall<StreakWebhook>({
    apiKey,
    method: HttpMethod.POST,
    path: '/api/v2/webhooks',
    queryParams: { pipelineKey },
    contentType: 'application/json',
    body: { event, targetUrl },
  });
  return response.body;
}

export async function createTeamWebhook({
  apiKey,
  teamKey,
  event,
  targetUrl,
}: {
  apiKey: string;
  teamKey: string;
  event: string;
  targetUrl: string;
}): Promise<StreakWebhook> {
  const response = await streakApiCall<StreakWebhook>({
    apiKey,
    method: HttpMethod.POST,
    path: '/api/v2/webhooks',
    queryParams: { teamKey },
    contentType: 'application/json',
    body: { event, targetUrl },
  });
  return response.body;
}

export async function deleteWebhook({
  apiKey,
  webhookKey,
}: {
  apiKey: string;
  webhookKey: string;
}): Promise<void> {
  await streakApiCall({
    apiKey,
    method: HttpMethod.DELETE,
    path: `/api/v2/webhooks/${webhookKey}`,
  });
}
