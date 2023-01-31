import { assertNotNullOrUndefined } from "../../../common/helpers/assertions";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpHeaders } from "../../../common/http/core/http-headers";
import { HttpRequest } from "../../../common/http/core/http-request";
import { QueryParams } from "../../../common/http/core/query-params";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
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
      required: true,
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
