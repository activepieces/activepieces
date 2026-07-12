import { randomUUID } from 'node:crypto';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
  QueryParams,
} from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const VEEZEE_BASE_URL = 'https://api.veezee.io';

const markdownDescription = `
Optional. Every action below also works with no key: calls run keyless under a free per-IP daily budget (20 credits/day, recent data only, no realtime fetches).

Paste an API key to raise those limits and unlock realtime fetches; it is sent as \`Authorization: Bearer <key>\`. Get a paid key at https://veezee.io/upgrade.
`;

export const veezeeAuth = PieceAuth.SecretText({
  displayName: 'Veezee API Key',
  description: markdownDescription,
  required: false,
  validate: async ({ auth }) => {
    if (!auth) {
      return { valid: true };
    }
    try {
      // GET /v1/usage is free (0 credits) and requires a key — good for validating one.
      await veezeeApiCall({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/v1/usage',
      });
      return { valid: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message.includes('401')) {
        return {
          valid: false,
          error:
            'Invalid API key. Leave this field empty to call keyless, or get a paid key at https://veezee.io/upgrade.',
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
    'Recent (default) serves cached data from the last few hours when available; Realtime forces a live fetch for +2 credits (refunded if the live fetch falls back to cached data). Keyless calls only support Recent.',
  required: false,
  options: {
    options: [
      { label: 'Recent (cached, default)', value: 'recent' },
      { label: 'Realtime (+2 credits, requires a paid key)', value: 'realtime' },
    ],
  },
});

export const maxCreditsProp = Property.Number({
  displayName: 'Max Credits',
  description:
    'Spend ceiling for this one call. The call is rejected (and nothing is charged) if its quote exceeds this. 0 is valid: the error returns the quoted price of the call without running it.',
  required: false,
});

export type VeezeeApiCallParams = {
  apiKey?: string;
  method: HttpMethod;
  resourceUri: string; // full path including the /v1 prefix, e.g. '/v1/linkedin/profiles'
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
    headers: {
      Accept: 'application/json',
      // Metered Veezee routes require an Idempotency-Key, even on GET.
      'Idempotency-Key': randomUUID(),
    },
    queryParams,
  };

  // Auth is optional on data routes: a keyless call runs under a free
  // per-IP daily budget, so only attach the header when a key is set.
  if (apiKey) {
    request.authentication = {
      type: AuthenticationType.BEARER_TOKEN,
      token: apiKey,
    };
  }

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: unknown) {
    const { status, body, message } = extractStatusAndBody(error);

    if (status === 403 && stringField(body, 'code') === 'TRIAL_CAP_EXCEEDED') {
      const retrySeconds = numberField(body, 'retry_after_seconds');
      const upgradeUrl = stringField(body, 'upgrade_url');
      const retryHint = retrySeconds ? ` Retry in ${retrySeconds}s` : '';
      const upgradeHint = upgradeUrl ? ` or get a paid key at ${upgradeUrl}` : '';
      throw new Error(
        `Veezee free keyless daily budget is used up.${retryHint}${
          retryHint && upgradeHint ? ',' : ''
        }${upgradeHint}.`
      );
    }

    if (status) {
      const bodyMessage =
        stringField(body, 'message') ??
        (typeof body === 'string' ? body : JSON.stringify(body));
      throw new Error(`Veezee API error ${status}: ${bodyMessage || message || 'Unknown error'}`);
    }

    throw new Error(`Veezee request failed: ${message || 'Unknown error'}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringField(body: unknown, field: string): string | undefined {
  return isRecord(body) && typeof body[field] === 'string' ? body[field] : undefined;
}

function numberField(body: unknown, field: string): number | undefined {
  return isRecord(body) && typeof body[field] === 'number' ? body[field] : undefined;
}

// httpClient throws an HttpError-shaped object (or a plain Error) on any
// non-2xx response; pull the pieces our error handling needs without `as`.
function extractStatusAndBody(error: unknown): {
  status?: number;
  body?: unknown;
  message?: string;
} {
  const message = error instanceof Error ? error.message : undefined;
  if (!isRecord(error)) {
    return { message };
  }
  const response = isRecord(error['response']) ? error['response'] : undefined;
  const status =
    numberField(response, 'status') ??
    numberField(error, 'statusCode') ??
    numberField(error, 'status');
  const body = response ? response['body'] : error['body'];
  return { status, body, message };
}

type QueryValue = string | number | boolean | undefined | null;
