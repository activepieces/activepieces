import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

const aPI_BASE_URL = 'https://api2.frontapp.com';

export const makeRequest = async <T extends object>(
  token: string,
  method: HttpMethod,
  url: string,
  body?: object
): Promise<T> => {
  const request: HttpRequest = {
    method: method,
    url: `${aPI_BASE_URL}${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: token,
    },
    body: body,
  };

  const response = await httpClient.sendRequest<T>(request);
  return response.body;
};
