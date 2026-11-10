import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetPronunciationDictionaryOutputSchema } from '../../output-schemas';

export const getPronunciationDictionary = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_pronunciation_dictionary',
  outputSchema: elevenlabsGetPronunciationDictionaryOutputSchema,
  displayName: 'Get Pronunciation Dictionary',
  description: 'Get a pronunciation dictionary',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a pronunciation dictionary with its latest version_id and rules.',
    idempotent: true,
  },
  props: {
    pronunciationDictionaryId: Property.ShortText({ displayName: 'Pronunciation Dictionary ID', description: 'The id from Create Pronunciation Dictionary or List Pronunciation Dictionaries', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/pronunciation-dictionaries/${encodeURIComponent(propsValue.pronunciationDictionaryId)}`,
    });
    return response ?? { success: true };
  },
});
