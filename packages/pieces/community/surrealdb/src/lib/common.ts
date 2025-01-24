import {
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { surrealdbAuth } from '..';

const query = async (
  auth: PiecePropValueSchema<typeof surrealdbAuth>,
  query: string,
  args?: Record<string, string>
) => {
  const { url, username, password, namespace, database } = auth;

  const sqlUrl = new URL('/sql', url);
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: sqlUrl.toString(),
    headers: {
      'Content-Type': 'text/plain',
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
        'base64'
      )}`,
      'surreal-ns': namespace,
      'surreal-db': database,
    },
    queryParams: args,
    body: query,
  };

  const response = await httpClient.sendRequest(request);

  return response;
};

export default {
  query,
};
