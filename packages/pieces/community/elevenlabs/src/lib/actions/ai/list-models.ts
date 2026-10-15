import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListModelsOutputSchema } from '../../output-schemas';

export const listModels = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_models',
  outputSchema: elevenlabsListModelsOutputSchema,
  displayName: 'List Models',
  description: 'List the available ElevenLabs models',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists every model with its id, supported languages, character limits and capabilities such as text-to-speech or voice conversion. Use to find the model_id that other actions need.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await elevenlabsClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/models`,
    });
    return { items: response, count: response.length };
  },
});
