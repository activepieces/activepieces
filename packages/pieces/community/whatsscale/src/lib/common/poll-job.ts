import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleClient } from './client';

const POLL_INTERVAL_MS = 3000;
const MAX_ATTEMPTS = 20;

export async function pollJob(apiKey: string, jobId: string): Promise<Record<string, unknown>> {
  if (!jobId) throw new Error('No jobId returned from API');
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await whatsscaleClient(apiKey, HttpMethod.GET, `/api/status/${jobId}`);
    const body = response.body as { status: string; result?: Record<string, unknown>; error?: string };

    if (body.status === 'COMPLETED') return body.result ?? body;
    if (body.status === 'FAILED') throw new Error(body.error ?? 'Job failed');

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Job timed out after 20 attempts');
}
