import { HttpMethod } from '@activepieces/pieces-common';
import { pocketbaseClient } from './client';
import type { PocketbaseAuthValue } from './types';

async function getFileToken({ auth }: { auth: PocketbaseAuthValue }): Promise<string> {
  const response = await pocketbaseClient.request<{ token: string }>({
    auth,
    method: HttpMethod.POST,
    path: '/api/files/token',
  });
  return response.token;
}

export const pocketbaseApi = { getFileToken };
