import {
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import OpenAI from 'openai';
import { localaiAuth } from './auth';

type LocalaiAuthValue = AppConnectionValueForAuthProperty<typeof localaiAuth>;

function baseUrl(auth: LocalaiAuthValue): string {
  return auth.props.base_url.trim().replace(/\/+$/, '');
}

function accessToken(auth: LocalaiAuthValue): string {
  return auth.props.access_token?.trim() ?? '';
}

function client(auth: LocalaiAuthValue): OpenAI {
  return new OpenAI({
    baseURL: baseUrl(auth),
    apiKey: accessToken(auth),
    timeout: REQUEST_TIMEOUT_MS,
    maxRetries: 1,
  });
}

function authHeaders(auth: LocalaiAuthValue): Record<string, string> {
  const token = accessToken(auth);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function friendlyError(error: unknown): Error {
  if (error instanceof OpenAI.APIError) {
    return describeFailure({ status: error.status, detail: error.message });
  }
  const httpFailure = readHttpFailure(error);
  if (httpFailure) {
    return describeFailure(httpFailure);
  }
  if (error instanceof Error && error.message === 'fetch failed') {
    return describeFailure({ status: undefined, detail: error.message });
  }
  return error instanceof Error ? error : new Error(String(error));
}

function describeFailure({
  status,
  detail,
}: {
  status: number | undefined;
  detail: string;
}): Error {
  if (status === 401 || status === 403) {
    return new Error(
      `LocalAI rejected the access token (${status}). Check the Access Token on the connection matches one of the server's API keys. ${detail}`
    );
  }
  if (status === 404) {
    return new Error(
      `LocalAI returned 404. Check the Server URL and that the model is installed on the server. ${detail}`
    );
  }
  if (status === undefined) {
    return new Error(
      `Could not reach the LocalAI server. Check the Server URL and that the server is running and reachable from Activepieces. ${detail}`
    );
  }
  return new Error(`LocalAI error ${status}: ${detail}`);
}

function readHttpFailure(
  error: unknown
): { status: number; detail: string } | null {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return null;
  }
  const response = error.response;
  if (
    typeof response !== 'object' ||
    response === null ||
    !('status' in response) ||
    typeof response.status !== 'number'
  ) {
    return null;
  }
  const body = 'body' in response ? response.body : undefined;
  return { status: response.status, detail: extractMessage(body) };
}

function extractMessage(body: unknown): string {
  const text =
    body instanceof ArrayBuffer
      ? Buffer.from(body).toString('utf8')
      : Buffer.isBuffer(body)
        ? body.toString('utf8')
        : typeof body === 'string'
          ? body
          : JSON.stringify(body ?? '');
  try {
    const parsed: unknown = JSON.parse(text);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'error' in parsed &&
      typeof parsed.error === 'object' &&
      parsed.error !== null &&
      'message' in parsed.error &&
      typeof parsed.error.message === 'string'
    ) {
      return parsed.error.message;
    }
  } catch {
    return text.slice(0, 500);
  }
  return text.slice(0, 500);
}

function modelDropdown({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.Dropdown({
    auth: localaiAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your LocalAI server first',
          options: [],
        };
      }
      try {
        const response = await client(auth).models.list();
        return {
          disabled: false,
          options: response.data.map((model) => ({
            label: model.id,
            value: model.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder:
            "Couldn't load models. Check the Server URL and Access Token.",
        };
      }
    },
  });
}

const REQUEST_TIMEOUT_MS = 240_000;

export const localaiCommon = {
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
  baseUrl,
  client,
  authHeaders,
  friendlyError,
  modelDropdown,
};
