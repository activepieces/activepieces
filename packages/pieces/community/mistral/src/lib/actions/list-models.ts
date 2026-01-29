import { createAction } from '@activepieces/pieces-framework';
import { Mistral } from '@mistralai/mistralai';
import { mistralAuth } from '../..';

export const listModels = createAction({
  auth: mistralAuth,
  name: 'list_models',
  displayName: 'List Models',
  description: 'List all available Mistral AI models',
  props: {},
  async run({ auth }) {
    const client = new Mistral({
      apiKey: auth,
    });

    const response = await client.models.list();

    return response;
  },
});
