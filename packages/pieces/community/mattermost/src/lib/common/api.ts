import { HttpMethod } from '@activepieces/pieces-common';
import { mattermostClient } from './client';
import type { MattermostAuthValue, MattermostUser } from './types';

async function getMe({ auth }: { auth: MattermostAuthValue }): Promise<MattermostUser> {
  return await mattermostClient.request<MattermostUser>({
    auth,
    method: HttpMethod.GET,
    path: '/users/me',
  });
}

export const mattermostApi = { getMe };
