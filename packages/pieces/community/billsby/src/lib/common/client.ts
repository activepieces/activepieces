import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import type { BillsbyAuthType } from '../auth';

type BillsbyRequestParams = {
  auth: BillsbyAuthType;
  path: string;
  method?: HttpMethod;
  body?: Record<string, unknown>;
  queryParams?: Record<string, string>;
};

export async function billsbyRequest<TResponse>({
  auth,
  path,
  method = HttpMethod.GET,
  body,
  queryParams,
}: BillsbyRequestParams): Promise<TResponse> {
  const baseUrl = `https://public.billsby.com/api/v1/rest/core/${auth.company_domain}`;

  const response = await httpClient.sendRequest<TResponse>({
    method,
    url: `${baseUrl}${path}`,
    headers: {
      ApiKey: auth.api_key,
      'Content-Type': 'application/json',
    },
    body,
    queryParams,
  });

  return response.body;
}
