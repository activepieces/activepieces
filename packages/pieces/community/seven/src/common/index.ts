import {
  type HttpResponse,
  type HttpRequest,
  httpClient
} from '@ensemble/pieces-common';

export const callSevenApi = async <T>(
  httpRequest: Omit<HttpRequest, 'url'>,
  path: string,
  apiKey: string
): Promise<HttpResponse<T>> => {
  return await httpClient.sendRequest<T>({
    ...httpRequest,
    headers: {
      ...httpRequest.headers,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      SentWith: 'Ensemble',
      'X-Api-Key': apiKey
    },
    url: `https://gateway.seven.io/api/${path}`
  });
};
