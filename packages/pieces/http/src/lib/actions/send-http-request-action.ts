import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpHeaders,
  QueryParams,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';
import { httpMethodDropdown } from '../common/props';
import { assertNotNullOrUndefined } from '@activepieces/shared';

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
    extra: Property.DynamicProperties({
      displayName: 'Body',
      required: false,
      refreshers: ['method'],
      props: async ({ method }) => {
        const methodName = method as unknown as HttpMethod;
        if (methodName === HttpMethod.GET) return {};
        const properties: { [key: string]: any } = {}
        properties['body'] = Property.Json({
          displayName: 'Body',
          required: false,
        })

        return properties;
      }
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
    const { method, url, headers, queryParams, extra, failsafe, timeout } =
      context.propsValue;

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest<Record<string, unknown>> = {
      method,
      url,
      headers: headers as HttpHeaders,
      queryParams: queryParams as QueryParams,
      timeout: timeout ? timeout * 1000 : 0,
    };
    if (method !== HttpMethod.GET) {
      request.body = extra?.body;
    }

    try {
      return await httpClient.sendRequest(request);
    } catch (error) {
      if (failsafe) {
        return (error as HttpError).errorMessage()
      }
      throw error;
    }
  },
});
