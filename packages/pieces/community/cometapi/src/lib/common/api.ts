import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiClient } from './client';
import type {
  CometApiAuthValue,
  CometApiMidjourneySubmitResponse,
  CometApiModel,
} from './types';

async function listModels({
  auth,
}: {
  auth: CometApiAuthValue;
}): Promise<CometApiModel[]> {
  const response = await cometApiClient.request<{ data: CometApiModel[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/models',
  });
  return response.data;
}

async function submitMidjourneyTask({
  auth,
  endpoint,
  body,
}: {
  auth: CometApiAuthValue;
  endpoint: string;
  body: Record<string, unknown>;
}): Promise<CometApiMidjourneySubmitResponse> {
  const response =
    await cometApiClient.request<CometApiMidjourneySubmitResponse>({
      auth,
      method: HttpMethod.POST,
      host: 'root',
      path: `/mj/submit/${endpoint}`,
      body,
    });
  if (!MIDJOURNEY_SUBMITTED_CODES.includes(response.code)) {
    throw new Error(
      `Midjourney rejected the ${endpoint} submission (code ${response.code}): ${response.description}`
    );
  }
  return response;
}

export const cometApiApi = { listModels, submitMidjourneyTask };

const MIDJOURNEY_SUBMITTED_CODES = [1, 21, 22];
