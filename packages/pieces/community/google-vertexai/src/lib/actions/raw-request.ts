import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { vertexAiAuth, GoogleVertexAIAuthValue } from '../auth';
import { getCachedAccessToken } from '../common/auth';

const HTTP_METHODS = [
  { label: 'GET', value: HttpMethod.GET },
  { label: 'POST', value: HttpMethod.POST },
  { label: 'PUT', value: HttpMethod.PUT },
  { label: 'PATCH', value: HttpMethod.PATCH },
  { label: 'DELETE', value: HttpMethod.DELETE },
];

export const rawRequest = createAction({
  auth: vertexAiAuth,
  name: 'raw_request',
  displayName: 'Raw API Request',
  description:
    'Make a custom HTTP request to the Vertex AI API with automatic authentication',
  props: {
    method: Property.StaticDropdown({
      displayName: 'HTTP Method',
      description: 'The HTTP method for the request',
      required: true,
      options: {
        disabled: false,
        options: HTTP_METHODS,
      },
    }),
    url: Property.ShortText({
      displayName: 'URL',
      description:
        'The full URL for the API request (e.g., https://aiplatform.googleapis.com/v1/...)',
      required: true,
    }),
    body: Property.Json({
      displayName: 'Request Body',
      description: 'The JSON request body (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { method, url, body } = context.propsValue;
    const auth = context.auth as GoogleVertexAIAuthValue;

    const { accessToken } = await getCachedAccessToken(
      auth.props.serviceAccountJson,
      context.store
    );

    const request: HttpRequest = {
      method: method as HttpMethod,
      url,
      body: body || undefined,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    }

    throw new Error(
      `API request failed with status ${response.status}: ${JSON.stringify(response.body)}`
    );
  },
});
