import { createAction, Property } from '@activepieces/pieces-framework';
import {
  assertNotNullOrUndefined,
  HttpRequest,
  HttpHeaders,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { httpMethodDropdown } from '../common/props';

export const httpSendRequestAction = createAction({
  name: 'send_request',
  displayName: 'Send HTTP request',
  description: 'Send HTTP request',
  props: {
    method: httpMethodDropdown,
    url: Property.ShortText({
      displayName: 'URL',
      required: true,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query params',
      required: true,
    }),
    body: Property.Json({
      displayName: 'Body',
      required: false,
    }),
    failsafe: Property.Checkbox({
      displayName: 'No Error On Failure',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout(in seconds)',
      required: false,
    }),
  },

  async run(context) {
    const { method, url, headers, queryParams, body, failsafe, timeout } =
      context.propsValue;

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest<Record<string, unknown>> = {
      method,
      url,
      headers: headers as HttpHeaders,
      queryParams: queryParams as QueryParams,
      body,
      timeout: timeout ? timeout * 1000 : 0,
    };

    try {
        const response = await httpClient.sendRequest(request);
        return {
            success: response.status && response.status == 200,
            ...response
        };
    } catch (error) {
      if (failsafe) {
        return {
            success: false,
            error
        };
      }
      throw error;
    }
  },
});
