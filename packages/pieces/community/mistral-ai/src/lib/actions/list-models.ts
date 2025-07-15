import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';

export const listModels = createAction({
  auth: mistralAuth,
  name: 'list_models',
  displayName: 'List Models',
  description: 'Retrieve a list of available Mistral models to use for completions or embeddings.',
  props: {},
  async run({ auth }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.mistral.ai/v1/models',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
      });
      const body = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      if (!body || !body.data) {
        throw new Error('Unexpected response from Mistral API.');
      }
      return body;
    } catch (e: any) {
      if (e.response?.data?.error) throw new Error(`Mistral API error: ${e.response.data.error}`);
      if (e.response?.data?.message) throw new Error(`Mistral API error: ${e.response.data.message}`);
      if (e.message) throw new Error(`Request failed: ${e.message}`);
      throw new Error('Unknown error occurred while listing models.');
    }
  },
});

export type MistralModel = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  permission: any[];
};

export type MistralListModelsResponse = {
  object: string;
  data: MistralModel[];
}; 