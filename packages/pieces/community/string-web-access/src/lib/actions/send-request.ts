import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { stringWebAccessAuth } from '../auth';
import { describeRequestError, makeRequest } from '../common';

export const sendRequest = createAction({
  auth: stringWebAccessAuth,
  name: 'send_request',
  displayName: 'Send Request To URL',
  description: 'Send a POST, PUT, or PATCH request to a URL and return the response.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Sends a POST, PUT or PATCH request with a body to a URL through String Web Access, returning the response. Many of these calls are reads that the destination only accepts as a POST — a GraphQL query, a search backend, a JSON API that refuses GET. Use Fetch URL for a plain GET. This can change state on the destination, so do not repeat it blindly.',
    idempotent: false,
  },
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The endpoint to call.',
      required: true,
    }),
    method: Property.StaticDropdown<'POST' | 'PUT' | 'PATCH'>({
      displayName: 'Method',
      description: 'The HTTP method to use. A body is only valid on these three.',
      required: true,
      defaultValue: 'POST',
      options: {
        disabled: false,
        options: [
          { label: 'POST', value: 'POST' },
          { label: 'PUT', value: 'PUT' },
          { label: 'PATCH', value: 'PATCH' },
        ],
      },
    }),
    body: Property.Json({
      displayName: 'Body',
      description: 'The request body. Objects are JSON-stringified before sending.',
      required: true,
    }),
    format: Property.StaticDropdown<'markdown' | 'raw' | 'json'>({
      displayName: 'Format',
      description: 'How the response is returned. Use the JSON envelope to read the status and headers.',
      required: false,
      defaultValue: 'json',
      options: {
        disabled: false,
        options: [
          { label: 'JSON envelope', value: 'json' },
          { label: 'Raw', value: 'raw' },
          { label: 'Markdown', value: 'markdown' },
        ],
      },
    }),
    headers: Property.Object({
      displayName: 'Custom Headers',
      description: 'Request headers to forward, for example an `Authorization` header for the destination.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const body: Record<string, unknown> = {
      url: propsValue.url,
      method: propsValue.method,
      body: propsValue.body,
      format: propsValue.format ?? 'json',
    };

    if (propsValue.headers && Object.keys(propsValue.headers).length > 0) {
      body['headers'] = propsValue.headers;
    }

    try {
      return await makeRequest(auth.secret_text, HttpMethod.POST, '/fetch', body);
    } catch (error: any) {
      throw describeRequestError(error, 'The request could not be sent.');
    }
  },
});
