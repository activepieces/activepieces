import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsAddPronunciationRulesOutputSchema } from '../../output-schemas';

export const addPronunciationRules = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_add_pronunciation_rules',
  outputSchema: elevenlabsAddPronunciationRulesOutputSchema,
  displayName: 'Add Pronunciation Rules',
  description: 'Add rules to a pronunciation dictionary',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Adds alias or phoneme rules to a pronunciation dictionary and returns the new version_id. Each call creates a new dictionary version, so it is not idempotent.',
    idempotent: false,
  },
  props: {
    pronunciationDictionaryId: Property.ShortText({ displayName: 'Pronunciation Dictionary ID', description: 'The id from Create Pronunciation Dictionary or List Pronunciation Dictionaries', required: true }),
    rules: Property.Json({ displayName: 'Rules', description: 'JSON array of rules, such as [{"type": "alias", "string_to_replace": "AP", "alias": "Activepieces"}] or {"type": "phoneme", "string_to_replace": "...", "phoneme": "...", "alphabet": "ipa"}', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/pronunciation-dictionaries/${encodeURIComponent(propsValue.pronunciationDictionaryId)}/add-rules`,
      body: elevenlabsClient.compact({ values: { rules: propsValue.rules } }),
    });
    return response ?? { success: true };
  },
});
