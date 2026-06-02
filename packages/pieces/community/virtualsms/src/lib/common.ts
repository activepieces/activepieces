import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export const BASE_URL = 'https://virtualsms.io';

// validate() receives the raw entered string; action/trigger run() receives { secret_text }.
type AuthValue = string | { secret_text: string };

function extractApiKey(auth: AuthValue): string {
  return typeof auth === 'string' ? auth : auth.secret_text;
}

export const virtualSmsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your VirtualSMS API key. Get one at https://virtualsms.io → Settings → API Keys.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await request(auth, HttpMethod.GET, '/api/v1/customer/balance');
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: `Invalid API key or network error: ${(e as Error).message}`,
      };
    }
  },
});

export async function request<T = unknown>(
  auth: AuthValue,
  method: HttpMethod,
  path: string,
  body?: unknown,
  queryParams?: Record<string, string | undefined>
): Promise<T> {
  const apiKey = extractApiKey(auth);
  const req: HttpRequest = {
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      'X-API-Key': apiKey,
      Accept: 'application/json',
    },
    body,
    queryParams: queryParams
      ? (Object.fromEntries(
          Object.entries(queryParams).filter(([, v]) => v !== undefined && v !== '')
        ) as Record<string, string>)
      : undefined,
  };
  const resp = await httpClient.sendRequest<T>(req);
  return resp.body;
}

interface ServiceItem {
  service_code: string;
  name: string;
}

interface CountryItem {
  country_code: string;
  name: string;
}

export async function serviceDropdownOptions(auth: AuthValue | undefined) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account first', options: [] };
  }
  const resp = await request<{ services?: ServiceItem[] }>(
    auth,
    HttpMethod.GET,
    '/api/v1/customer/services'
  );
  return {
    options: (resp.services ?? []).map((s) => ({ label: s.name, value: s.service_code })),
  };
}

export async function countryDropdownOptions(
  auth: AuthValue | undefined,
  service?: unknown
) {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your account first', options: [] };
  }
  const resp = await request<{ countries?: CountryItem[] }>(
    auth,
    HttpMethod.GET,
    '/api/v1/customer/countries',
    undefined,
    service ? { service: String(service) } : undefined
  );
  return {
    options: (resp.countries ?? []).map((c) => ({ label: c.name, value: c.country_code })),
  };
}
