import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';

export const listModels = createAction({
  auth: mistralAuth,
  name: 'list_models',
	displayName: 'List Models',
	description: 'Retrieves a list of available Mistral AI models.',
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
     
      return response.body;
    } catch (e: any) {
     throw new Error(parseMistralError(e));
    }
  },
});
