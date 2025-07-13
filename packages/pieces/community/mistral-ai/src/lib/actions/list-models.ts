import { createAction, Property } from '@activepieces/pieces-framework';
import { mistralAiAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const listModels = createAction({
  auth: mistralAiAuth,
  name: 'listModels',
  displayName: 'List Models',
  description: 'Retrieve a list of available Mistral models to use for completions or embeds.',
  props: {},
  async run({ auth }) {

    const models = await makeRequest(
      auth as string,
      HttpMethod.GET,
      '/models',
      {}
    );

    return models
  },
});
