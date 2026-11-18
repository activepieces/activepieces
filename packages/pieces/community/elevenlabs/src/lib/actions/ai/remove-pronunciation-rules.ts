import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsAddPronunciationRulesOutputSchema } from '../../output-schemas';

export const removePronunciationRules = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_remove_pronunciation_rules',
  outputSchema: elevenlabsAddPronunciationRulesOutputSchema,
  displayName: 'Remove Pronunciation Rules',
  description: 'Remove rules from a pronunciation dictionary',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Removes rules from a pronunciation dictionary by their string_to_replace values and returns the new version_id. Removing rules that are already gone changes nothing.',
    idempotent: true,
  },
  props: {
    pronunciationDictionaryId: Property.ShortText({ displayName: 'Pronunciation Dictionary ID', description: 'The id from Create Pronunciation Dictionary or List Pronunciation Dictionaries', required: true }),
    ruleStrings: Property.Array({ displayName: 'Rule Strings', description: 'The string_to_replace values of the rules to remove', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/pronunciation-dictionaries/${encodeURIComponent(propsValue.pronunciationDictionaryId)}/remove-rules`,
      body: elevenlabsClient.compact({ values: { rule_strings: propsValue.ruleStrings } }),
    });
    return response ?? { success: true };
  },
});
