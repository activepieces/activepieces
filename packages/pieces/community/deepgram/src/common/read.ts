import { HttpMethod } from '@activepieces/pieces-common';
import { DEEPGRAM_TIMEOUTS, deepgramClient, QueryInput } from './client';
import { ReadResponse } from './transcript';

async function readText({
  apiKey,
  query,
  source,
}: {
  apiKey: string;
  query: QueryInput;
  source: { text: string } | { url: string };
}): Promise<ReadResponse> {
  const response = await deepgramClient.request<ReadResponse>({
    apiKey,
    method: HttpMethod.POST,
    path: '/read',
    query,
    body: source,
    timeoutMs: DEEPGRAM_TIMEOUTS.read,
    operation: 'analyze the text',
  });
  return response.body ?? {};
}

export const deepgramRead = { readText };
