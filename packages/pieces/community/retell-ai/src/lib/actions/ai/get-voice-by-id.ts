import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getVoiceByIdAction = createAction({
  auth: retellAiAuth,
  name: 'get_voice_by_id',
  classification: 'READ',
  displayName: 'Get Voice by ID',
  description: 'Returns one voice.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Retell voice by voice_id with provider, gender, accent, age and preview audio link. Read-only.',
    idempotent: true,
  },
  props: {
    voice_id: retellAiProps.id({ displayName: 'Voice ID', description: 'For example 11labs-Adrian. Use List Voices to find it.' }),
  },
  outputSchema: retellSchemas.voice,
  async run({ auth, propsValue }) {
    const voice = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-voice/${retellInput.seg({ value: propsValue.voice_id, label: 'Voice ID' })}`,
      retryRateLimit: true,
    });
    return retellMap.voice(voice);
  },
});
