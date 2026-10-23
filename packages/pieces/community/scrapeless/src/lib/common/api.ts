import { HttpMethod } from '@activepieces/pieces-common';

import { scrapelessClient } from './client';

import type { ScrapelessAuthValue } from './types';

async function getMe({
  auth,
}: {
  auth: ScrapelessAuthValue;
}): Promise<unknown> {
  return await scrapelessClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/me',
  });
}

export const scrapelessApi = { getMe };
