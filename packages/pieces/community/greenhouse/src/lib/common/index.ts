import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

const BASE_URL = 'https://harvest.greenhouse.io/v1';

export async function greenhouseApiCall<T extends HttpMessageBody>({
  apiKey,
  method,
  endpoint,
  body,
  queryParams,
  onBehalfOf,
}: {
  apiKey: string;
  method: HttpMethod;
  endpoint: string;
  body?: Record<string, unknown>;
  queryParams?: QueryParams;
  onBehalfOf?: string;
}) {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${endpoint}`,
    authentication: {
      type: AuthenticationType.BASIC,
      username: apiKey,
      password: '',
    },
    headers: onBehalfOf ? { 'On-Behalf-Of': onBehalfOf } : undefined,
    body,
    queryParams,
  });
}

export const onBehalfOfProp = Property.ShortText({
  displayName: 'Performed By (User ID)',
  description:
    'The numeric ID of the Greenhouse user on whose behalf this action is recorded — required for the audit log. ' +
    'To find it: go to **Configure → Users**, click a user, and copy the number from the URL ' +
    '(e.g. `https://app.greenhouse.io/people/**12345**`).',
  required: true,
});
