import { HttpMethod } from '@activepieces/pieces-common';
import { groqClient } from './client';
import type { GroqAuthValue, GroqModel, GroqModelList } from './types';

async function listModels({
  auth,
}: {
  auth: GroqAuthValue;
}): Promise<GroqModel[]> {
  const response = await groqClient.request<GroqModelList>({
    auth,
    method: HttpMethod.GET,
    path: '/models',
  });
  return response.data;
}

export const groqApi = { listModels };
