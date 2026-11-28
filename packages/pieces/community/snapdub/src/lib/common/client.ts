import { createHmac, timingSafeEqual } from 'crypto';
import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMessageBody,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

async function call<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${SNAPDUB_BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      headers: { Accept: 'application/json' },
      body,
      queryParams,
    });
    return response.body;
  } catch (error) {
    throw new Error(errorMessage({ error }));
  }
}

function errorMessage({ error }: { error: unknown }): string {
  if (error instanceof HttpError) {
    const body = error.response.body;
    if (isRecord(body) && typeof body['error'] === 'string') {
      return body['error'];
    }
    return `SnapDub answered with status ${error.response.status}.`;
  }
  return error instanceof Error ? error.message : String(error);
}

function compact({
  values,
}: {
  values: Record<string, unknown>;
}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  );
}

function verifySignature({
  secret,
  header,
  rawBody,
}: {
  secret: string;
  header: string | undefined;
  rawBody: unknown;
}): boolean {
  if (typeof header !== 'string' || typeof rawBody !== 'string') {
    return false;
  }
  const parts = Object.fromEntries(
    header.split(',').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, rest.join('=')];
    })
  );
  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) {
    return false;
  }
  const expected = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex');
  const given = Buffer.from(signature, 'utf8');
  const wanted = Buffer.from(expected, 'utf8');
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const SNAPDUB_BASE_URL = 'https://snapdub.ai/api/v1';

export const snapdubClient = {
  call,
  compact,
  errorMessage,
  isRecord,
  verifySignature,
};

export type SnapDubVideo = {
  video_id: string;
  title?: string;
  kind?: string;
  status: string;
  progress_percent?: number;
  duration_seconds?: number;
  clips_ready?: number;
  created_at?: string;
  error?: string;
  url?: string;
};

export type SnapDubClip = {
  clip_id: string;
  title?: string;
  virality_score?: number;
  description?: string;
  hashtags?: string;
  duration_seconds?: number;
  download_url?: string;
  thumbnail_url?: string;
};

export type SnapDubVideoWithClips = SnapDubVideo & {
  clips: SnapDubClip[];
  note?: string;
};
