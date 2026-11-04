import { HttpMethod } from '@activepieces/pieces-common';
import { filetopdfClient } from './client';
import type { FiletopdfAccount, FiletopdfAccountEnvelope, FiletopdfAuthValue } from './types';

async function getAccount({ auth }: { auth: FiletopdfAuthValue }): Promise<FiletopdfAccount | undefined> {
  const envelope = await filetopdfClient.request<FiletopdfAccountEnvelope>({
    auth,
    method: HttpMethod.GET,
    path: '/account',
  });
  return envelope.data;
}

export const filetopdfApi = { getAccount };
