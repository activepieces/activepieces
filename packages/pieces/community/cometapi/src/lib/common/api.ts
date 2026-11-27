import { HttpMethod } from '@activepieces/pieces-common';
import { cometApiClient } from './client';
import type { CometApiAuthValue, CometApiModel } from './types';

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

export const cometApiApi = { listModels };
