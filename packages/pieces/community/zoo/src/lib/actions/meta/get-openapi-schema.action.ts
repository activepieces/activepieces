import { createAction } from '@activepieces/pieces-framework';
import { zooAuth } from '../../auth'
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getOpenApiSchemaAction = createAction({
  name: 'get_openapi_schema',
  displayName: 'Get OpenAPI Schema',
  description: 'Retrieve the OpenAPI schema for the Zoo API',
  audience: 'both',
  aiMetadata: { description: 'Fetch the full OpenAPI schema describing the Zoo API. Read-only and repeatable; takes no input. Use to discover available endpoints, parameters, and response shapes.', idempotent: true },
  auth: zooAuth,
  // category: 'Meta',
  props: {},
  async run({ auth }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.zoo.dev/',
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });
    return response.body;
  },
});
