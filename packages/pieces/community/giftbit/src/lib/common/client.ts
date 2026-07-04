import { HttpMethod, AuthenticationType, httpClient } from '@activepieces/pieces-common';

export const TESTBED_URL = 'https://api-testbed.giftbit.com/papi/v1';
export const PRODUCTION_URL = 'https://api.giftbit.com/papi/v1';

export const giftbitApiCall = async ({
  auth,
  method,
  resourceUri,
  body,
  useTestbed = false,
}: {
  auth: string;
  method: HttpMethod;
  resourceUri: string;
  body?: unknown;
  useTestbed?: boolean;
}) => {
  const baseUrl = useTestbed ? TESTBED_URL : PRODUCTION_URL;

  const response = await httpClient.sendRequest({
    method,
    url: `${baseUrl}${resourceUri}`,
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
