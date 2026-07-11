import { randomUUID } from 'node:crypto';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const VEEZEE_BASE_URL = 'https://api.veezee.io/v1';

const markdownDescription = `
Paste your Veezee API key. It is sent as \`Authorization: Bearer <key>\`.

If you do not have a key yet: the provision endpoint at https://veezee.io/docs issues a free trial key without account setup.
`;

export const veezeeAuth = PieceAuth.SecretText({
  displayName: 'Veezee API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'API key is required.',
      };
    }
    try {
      // GET /usage is free (0 credits) — ideal for validating the key.
      await veezeeApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/usage',
      });
      return { valid: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('401')) {
        return {
          valid: false,
          error:
            'Invalid API key. Provision a free one with: curl -X POST https://api.veezee.io/v1/provision',
        };
      }
      return {
        valid: false,
        error: `Could not reach Veezee to validate the key: ${message}`,
      };
    }
  },
});

export const freshnessProp = Property.StaticDropdown({
  displayName: 'Freshness',
  description:
    'Recent (default) serves cached data from the last few hours when available; Realtime forces a live fetch for +2 credits (refunded if the live fetch falls back to cached data).',
  required: false,
  options: {
    options: [
      { label: 'Recent (cached, default)', value: 'recent' },
      { label: 'Realtime (+2 credits)', value: 'realtime' },
    ],
  },
});

export const maxCreditsProp = Property.Number({
  displayName: 'Max Credits',
  description:
    'Spend ceiling for this one call. The call is rejected (and nothing is charged) if its quote exceeds this.',
  required: false,
});

type QueryValue = string | number | boolean | undefined | null;

export type VeezeeApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, QueryValue>;
};

export async function veezeeApiCall<T>({
  apiKey,
  method,
  resourceUri,
  query,
}: VeezeeApiCallParams): Promise<T> {
  const maxCreditsValue = query?.['max_credits'];
  if (
    maxCreditsValue !== undefined &&
    maxCreditsValue !== null &&
    maxCreditsValue !== '' &&
    (!Number.isInteger(Number(maxCreditsValue)) || Number(maxCreditsValue) < 0)
  ) {
    throw new Error('Max Credits must be a whole number of 0 or more.');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParams[key] = String(value);
      }
    }
  }

  const request: HttpRequest = {
    method,
    url: `${VEEZEE_BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    },
    headers: {
      Accept: 'application/json',
      // Metered Veezee routes require an Idempotency-Key, even on GET.
      'Idempotency-Key': randomUUID(),
    },
    queryParams,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);

    if (response.status >= 400) {
      const bodyMessage =
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body);
      throw new Error(`Veezee API error ${response.status}: ${bodyMessage}`);
    }

    return response.body;
  } catch (error: unknown) {
    const veezeeError = error as {
      response?: { status?: number; body?: unknown };
      statusCode?: number;
      status?: number;
      body?: unknown;
      message?: string;
    };

    const statusCode =
      veezeeError.response?.status ??
      veezeeError.statusCode ??
      veezeeError.status;
    const errorBody = veezeeError.response?.body ?? veezeeError.body;

    if (statusCode) {
      const bodyMessage =
        typeof errorBody === 'string' ? errorBody : JSON.stringify(errorBody);
      throw new Error(
        `Veezee API error ${statusCode}: ${
          bodyMessage || veezeeError.message || 'Unknown error'
        }`
      );
    }

    throw new Error(
      `Veezee request failed: ${veezeeError.message || 'Unknown error'}`
    );
  }
}
