import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsUpdatePronunciationDictionaryOutputSchema } from '../../output-schemas';

export const updatePronunciationDictionary = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_pronunciation_dictionary',
  outputSchema: elevenlabsUpdatePronunciationDictionaryOutputSchema,
  displayName: 'Update Pronunciation Dictionary',
  description: 'Rename or archive a pronunciation dictionary',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Renames a pronunciation dictionary or archives it. Only the supplied fields change.',
    idempotent: true,
  },
  props: {
    pronunciationDictionaryId: Property.ShortText({ displayName: 'Pronunciation Dictionary ID', description: 'The id from Create Pronunciation Dictionary or List Pronunciation Dictionaries', required: true }),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    archived: Property.StaticDropdown({ displayName: 'Archived', description: 'Archive the dictionary', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.PATCH,
      path: `/v1/pronunciation-dictionaries/${encodeURIComponent(propsValue.pronunciationDictionaryId)}`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, archived: propsValue.archived } }),
    });
    return response ?? { success: true };
  },
});
