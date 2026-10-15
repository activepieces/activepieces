import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';

export const TRANSCRIPTFETCH_BASE_URL = 'https://transcriptfetch.com';

// Names this piece on every call, so TranscriptFetch can attribute requests
// to Activepieces. Keep the version in step with package.json.
export const CLIENT_HEADERS = { 'X-TranscriptFetch-Client': 'activepieces/0.0.1' };

const JOB_POLL_INTERVAL_MS = 5000;

export type TranscriptFetchResponse = Record<string, unknown> & {
  status?: string;
  job_id?: string;
  poll_url?: string;
};

export async function transcriptFetchRequest({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<TranscriptFetchResponse> {
  try {
    const response = await httpClient.sendRequest<TranscriptFetchResponse>({
      method,
      url: `${TRANSCRIPTFETCH_BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
        ...CLIENT_HEADERS,
      },
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(`TranscriptFetch API error (${error.response.status}): ${errorMessage(error.response.body)}`);
    }
    throw error;
  }
}

function errorMessage(body: unknown): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === 'object' && error !== null) {
      const { message, code } = error as { message?: unknown; code?: unknown };
      if (typeof message === 'string') return typeof code === 'string' ? `${code}: ${message}` : message;
    }
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Unknown error';
}

/**
 * A video without captions answers 202 with a transcription job. Poll it until
 * it finishes or the wait runs out; an unfinished job is returned as is (status
 * "processing" with an absolute poll_url) rather than thrown, since the
 * transcript is still coming and re-requesting the video later is free.
 */
export async function waitForJob({
  apiKey,
  first,
  maxWaitSeconds,
}: {
  apiKey: string;
  first: TranscriptFetchResponse;
  maxWaitSeconds: number;
}): Promise<TranscriptFetchResponse> {
  const deadline = Date.now() + maxWaitSeconds * 1000;
  const pollPath = first.poll_url ?? `/api/v2/transcripts/jobs/${first.job_id}`;
  let last = first;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, JOB_POLL_INTERVAL_MS));
    last = await transcriptFetchRequest({ apiKey, method: HttpMethod.GET, path: pollPath });
    if (last.status === 'completed' || last.status === 'failed') return last;
  }
  return withAbsolutePollUrl(last);
}

export function withAbsolutePollUrl(response: TranscriptFetchResponse): TranscriptFetchResponse {
  if (typeof response.poll_url === 'string' && response.poll_url.startsWith('/')) {
    return { ...response, poll_url: `${TRANSCRIPTFETCH_BASE_URL}${response.poll_url}` };
  }
  return response;
}

/** Drops empty optional values so the API receives only what was set. */
export function compact(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}
