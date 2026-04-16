import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export async function azureDevOpsApiCall<T extends HttpMessageBody>({
  organizationUrl,
  pat,
  method,
  endpoint,
  body,
  queryParams,
  isJsonPatch = false,
}: {
  organizationUrl: string;
  pat: string;
  method: HttpMethod;
  endpoint: string;
  body?: unknown;
  queryParams?: Record<string, string>;
  isJsonPatch?: boolean;
}): Promise<T> {
  const baseUrl = organizationUrl.replace(/\/+$/, '');
  const encoded = Buffer.from(`:${pat}`).toString('base64');

  const qs: QueryParams = {};
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        qs[key] = value;
      }
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${encoded}`,
  };

  if (body !== undefined) {
    headers['Content-Type'] = isJsonPatch
      ? 'application/json-patch+json'
      : 'application/json';
  }

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${endpoint}`,
    headers,
    queryParams: qs,
    body,
  });

  return response.body;
}
