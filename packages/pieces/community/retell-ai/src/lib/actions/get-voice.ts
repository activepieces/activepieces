import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { voiceIdDropdown } from '../common/props';
import { retellSchemas } from '../common/schemas';

export const getVoice = createAction({
  auth: retellAiAuth,
  name: 'get_voice',
  classification: 'READ',
  displayName: 'Get Voice',
  description: 'Retrieve details for a specific voice model or configuration by ID in Retell AI.',
  audience: 'human',
  aiMetadata: {
    description: 'Returns one Retell voice (provider, accent, gender, preview URL). Read-only.',
    idempotent: true,
  },
  props: {
    voiceId: voiceIdDropdown,
  },
  outputSchema: retellSchemas.rawVoice,
  async run({ propsValue, auth }) {
    return retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/get-voice/${retellInput.seg({ value: propsValue.voiceId, label: 'Voice ID' })}`,
      retryRateLimit: true,
    });
  },
});
