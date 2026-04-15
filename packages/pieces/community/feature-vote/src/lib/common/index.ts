import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { SecretTextConnectionValue } from '@activepieces/shared';

const BASE_URL = 'https://features.vote/api';

export async function featuresVoteApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: SecretTextConnectionValue;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey.secret_text}`,
    },
    queryParams,
    body,
  });
}