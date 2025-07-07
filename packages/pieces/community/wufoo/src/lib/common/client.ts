import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type WufooAuthProps = {
  apiKey: string;
  subdomain: string;
};

export type WufooApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: {
    apiKey: string;
    subdomain: string;
  };
};

export async function wufooApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: WufooApiCallParams): Promise<T> {
  const { apiKey, subdomain } = auth;
  const qs: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        qs[key] = String(value);
      }
    }
  }

  const baseUrl = `https://${subdomain}.wufoo.com/api/v3`;

  const request: HttpRequest = {
    method,
    url: baseUrl + resourceUri,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:footastic`).toString('base64')}`,
    },
    queryParams: qs,
    body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
}
