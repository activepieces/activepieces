import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreatePronunciationDictionaryFromRulesOutputSchema } from '../../output-schemas';

export const createPronunciationDictionaryFromRules = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_pronunciation_dictionary_from_rules',
  outputSchema: elevenlabsCreatePronunciationDictionaryFromRulesOutputSchema,
  displayName: 'Create Pronunciation Dictionary From Rules',
  description: 'Create a pronunciation dictionary from rules',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a pronunciation dictionary from a list of alias or phoneme rules and returns its id and version_id. Not idempotent: each call creates another dictionary.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', description: 'Dictionary name', required: true }),
    rules: Property.Json({ displayName: 'Rules', description: 'JSON array of rules, such as [{"type": "alias", "string_to_replace": "AP", "alias": "Activepieces"}] or {"type": "phoneme", "string_to_replace": "...", "phoneme": "...", "alphabet": "ipa"}', required: true }),
    description: Property.ShortText({ displayName: 'Description', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/pronunciation-dictionaries/add-from-rules`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, rules: propsValue.rules, description: propsValue.description } }),
    });
    return response ?? { success: true };
  },
});
