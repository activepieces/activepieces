import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listVoicesAction = createAction({
  auth: retellAiAuth,
  name: 'list_voices',
  classification: 'SEARCH',
  displayName: 'List Voices',
  description: 'Lists the voices available to agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every voice available in the workspace with provider, gender, accent and a preview link, optionally filtered by provider, gender or a name search. Use it to pick a voice_id for Update Agent. Read-only.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Optional text matched against voice name and ID.', required: false }),
    provider: Property.ShortText({ displayName: 'Provider', description: 'Optional provider such as elevenlabs, openai or cartesia.', required: false }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      options: { options: [{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }] },
    }),
  },
  outputSchema: retellSchemas.voiceList,
  async run({ auth, propsValue }) {
    const response = await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.GET, path: '/list-voices', retryRateLimit: true });
    const search = retellInput.optionalText(propsValue.search)?.toLowerCase();
    const provider = retellInput.optionalText(propsValue.provider)?.toLowerCase();
    const gender = retellInput.optionalText(propsValue.gender)?.toLowerCase();
    const items = retellMap
      .itemsOf(response)
      .map(retellMap.voice)
      .filter(
        (voice) =>
          (search === undefined || `${voice.voice_name ?? ''} ${voice.voice_id ?? ''}`.toLowerCase().includes(search)) &&
          (provider === undefined || (voice.provider ?? '').toLowerCase() === provider) &&
          (gender === undefined || (voice.gender ?? '').toLowerCase() === gender),
      );
    return { items, count: items.length };
  },
});
