import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

function normalizeBaseUrl({ baseUrl }: { baseUrl: string | undefined }): string {
  const trimmed = (baseUrl ?? '').trim().replace(/\/+$/, '');
  if (trimmed.length === 0) {
    return DEFAULT_BASE_URL;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function readStatus({ error }: { error: unknown }): number | undefined {
  const response = error instanceof Object ? Reflect.get(error, 'response') : undefined;
  const status = response instanceof Object ? Reflect.get(response, 'status') : undefined;
  return typeof status === 'number' ? status : undefined;
}

function readVendorMessage({ error }: { error: unknown }): string {
  const response = error instanceof Object ? Reflect.get(error, 'response') : undefined;
  const body = response instanceof Object ? Reflect.get(response, 'body') : undefined;
  if (typeof body === 'string' && body.trim().length > 0) {
    return body.trim().slice(0, 300);
  }
  if (body instanceof Object) {
    const message = Reflect.get(body, 'message');
    if (typeof message === 'string' && message.length > 0) {
      return message.slice(0, 300);
    }
    if (Array.isArray(message) && message.length > 0) {
      return message.map(String).join(', ').slice(0, 300);
    }
    return JSON.stringify(body).slice(0, 300);
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message.slice(0, 300);
  }
  return 'Unknown error';
}

function describeValidationError({ error }: { error: unknown }): string {
  const status = readStatus({ error });
  if (status === 401 || status === 403) {
    return 'Invalid API key';
  }
  const message = readVendorMessage({ error });
  if (status === 404) {
    return `Postiz returned 404 (${message}). Check that the Base URL ends with /public/v1, or /api/public/v1 when self-hosted.`;
  }
  if (status !== undefined) {
    return `Postiz returned ${status}: ${message}`;
  }
  return `Could not reach Postiz: ${message}`;
}

export const postizAuth = PieceAuth.CustomAuth({
  displayName: 'Postiz Connection',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description:
        'Keep the default for Postiz Cloud. Self-hosted: use your domain followed by /api/public/v1.',
      required: true,
      defaultValue: 'https://api.postiz.com/public/v1',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'In Postiz, open Settings, then Public API, and copy your API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${normalizeBaseUrl({ baseUrl: auth.base_url })}/is-connected`,
        headers: {
          Authorization: auth.api_key,
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: describeValidationError({ error }),
      };
    }
  },
});

const DEFAULT_BASE_URL = 'https://api.postiz.com/public/v1';

export { normalizeBaseUrl, describeValidationError, DEFAULT_BASE_URL };

export type PostizAuth = {
  props: {
    base_url?: string;
    api_key: string;
  };
};
