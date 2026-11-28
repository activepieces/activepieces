import { HttpMethod } from '@activepieces/pieces-common';
import { beamerClient } from './client';
import type { BeamerAuthValue, BeamerPost } from './types';

async function getPost({ auth, postId }: { auth: BeamerAuthValue; postId: string }): Promise<BeamerPost> {
  return await beamerClient.request<BeamerPost>({
    auth,
    method: HttpMethod.GET,
    path: `/posts/${encodeURIComponent(postId)}`,
    query: { ignoreRequestDetails: 'true' },
  });
}

export const beamerApi = { getPost };
