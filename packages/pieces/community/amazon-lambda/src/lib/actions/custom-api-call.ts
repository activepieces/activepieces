import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { awsLambdaCombinedAuth, type LambdaAuthProps } from '../auth';
import { customLambdaCall } from '../common/client';

export const customApiCall = createAction({
  name: 'customApiCall',
  displayName: 'Custom Action',
  description: 'Send a SigV4-signed request to the Lambda API in the connection\'s region. Method, path, query, headers, and JSON body are yours.',
  auth: awsLambdaCombinedAuth,
  requireAuth: true,
  audience: 'human',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Send a signed request to any AWS Lambda API path in the connection\'s region. Use only when no dedicated action covers the call; the effect and retry safety depend on the method and path.',
    idempotent: false,
  },
  props: {
    method: Property.StaticDropdown({
      displayName: 'Method',
      required: true,
      defaultValue: HttpMethod.GET,
      options: {
        options: Object.values(HttpMethod).map((method) => ({ label: method, value: method })),
      },
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Lambda API path, such as /2015-03-31/functions.',
      required: true,
    }),
    queryParams: Property.Object({
      displayName: 'Query parameters',
      description: 'Optional query string. Keys with empty values are skipped.',
      required: false,
    }),
    headers: Property.Object({
      displayName: 'Headers',
      description: 'Optional headers. Host and Authorization are set for you.',
      required: false,
    }),
    body: Property.Json({
      displayName: 'Body',
      description: 'Optional JSON body for POST, PUT, and PATCH.',
      required: false,
    }),
    timeout: Property.Number({
      displayName: 'Timeout (seconds)',
      description: 'How long to wait. Defaults to 30 seconds. Maximum is 900.',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const { method, path, queryParams, headers, body, timeout } = context.propsValue;
    const auth: LambdaAuthProps = context.auth.props;
    return customLambdaCall({
      auth,
      server: context.server,
      input: {
        method,
        path,
        queryParams,
        headers,
        body,
        timeoutSeconds: timeout,
      },
    });
  },
});
