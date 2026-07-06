import {
  HttpMethod,
  httpClient,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export const JUSTINVOICE_API_URL = 'https://api.justinvoice.io';

export type JustInvoiceApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
};

export async function justInvoiceApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  endpoint,
  query,
  body,
}: JustInvoiceApiCallParams): Promise<T> {
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const headers: Record<string, string> = {
    'Authorization': `ApiKey ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${JUSTINVOICE_API_URL}${endpoint}`,
    headers,
    queryParams: qs,
    body,
  });

  return response.body;
}
