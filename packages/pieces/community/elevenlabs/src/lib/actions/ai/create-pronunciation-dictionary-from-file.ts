import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreatePronunciationDictionaryFromRulesOutputSchema } from '../../output-schemas';

export const createPronunciationDictionaryFromFile = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_pronunciation_dictionary_from_file',
  outputSchema: elevenlabsCreatePronunciationDictionaryFromRulesOutputSchema,
  displayName: 'Create Pronunciation Dictionary From File',
  description: 'Create a pronunciation dictionary from a PLS file',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a pronunciation dictionary from an uploaded PLS file and returns its id and version_id. Not idempotent: each call creates another dictionary.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Dictionary name', required: true }),
    file: Property.File({ displayName: 'File', description: 'PLS file with the rules', required: false }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    const formData = new FormData();
    formData.append('name', String(propsValue.name));
    if (propsValue.file) {
      formData.append('file', propsValue.file.data, propsValue.file.filename);
    }
    if (propsValue.description !== undefined) {
      formData.append('description', String(propsValue.description));
    }
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/pronunciation-dictionaries/add-from-file`,
      formData,
    });
    return response ?? { success: true };
  },
});
