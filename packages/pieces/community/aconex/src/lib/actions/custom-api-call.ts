import { createAction, Property } from '@activepieces/pieces-framework';
import { customAconexCall } from '../api';
import { aconexAuth } from '../auth';
import { assertAuthProps, readAuth } from '../auth-props';

export const customApiCallAction = createAction({
  auth: aconexAuth,
  name: 'custom_api_call',
  displayName: 'Custom API Call',
  description:
    'Call a path on https://api.aconex.com/api. The path is not a full URL. A method other than GET or HEAD can change data in Aconex. If the call fails, the request body can appear in the worker log.',
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      description: 'HTTP method. GET is the default.',
      required: true,
      defaultValue: 'GET',
      options: {
        options: [
          { label: 'GET', value: 'GET' },
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
          { label: 'DELETE', value: 'DELETE' },
          { label: 'HEAD', value: 'HEAD' },
        ],
      },
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Path beginning with /, for example /projects. Absolute URLs are rejected.',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query parameters',
      description: 'Optional query string fields. Do not send username or password.',
      required: false,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Optional headers. Authorization is always the connection bearer. Set Accept when a mail version is required.',
      required: false,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Raw request body for POST, PUT, PATCH, and DELETE. Ignored for GET and HEAD.',
      required: false,
    }),
  },
  async run(context) {
    return customAconexCall(assertAuthProps(readAuth(context.auth)), {
      method: context.propsValue.method,
      path: context.propsValue.path,
      queryParams: context.propsValue.queryParams,
      headers: context.propsValue.headers,
      body: context.propsValue.body,
    });
  },
});
