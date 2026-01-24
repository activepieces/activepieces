import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';

export const BASE_URL = 'https://www.seektable.com/';

export const seekTableApiCall = async ({
  auth,
  method,
  resourceUri,
  body,
}: {
  auth: string;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
}) => {
  const response = await httpClient.sendRequest({
    method,
    url: `${BASE_URL}${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'identity',
    },
    body,
  });

  return response.body;
};
