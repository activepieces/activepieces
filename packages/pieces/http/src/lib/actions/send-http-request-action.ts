import { createAction, Property } from "@activepieces/framework";
import {assertNotNullOrUndefined, HttpRequest, HttpHeaders, QueryParams, httpClient} from "@activepieces/pieces-common";
import { httpMethodDropdown } from "../common/props";

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
  },

  async run(context) {
    const { method, url, headers, queryParams, body } = context.propsValue;

    assertNotNullOrUndefined(method, 'Method');
    assertNotNullOrUndefined(url, 'URL');

    const request: HttpRequest<Record<string, unknown>> = {
      method,
      url,
      headers: headers as HttpHeaders,
      queryParams: queryParams as QueryParams,
      body,
    };

    return await httpClient.sendRequest(request);
  },
});
