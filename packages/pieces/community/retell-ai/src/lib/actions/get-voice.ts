import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';
import { voiceIdDropdown } from '../common/props';

export const getVoice = createAction({
  auth: retellAiAuth,
  name: 'get_voice',
  displayName: 'Get Voice',
  description: 'Retrieve details for a specific voice model or configuration by ID in Retell AI.',
  props: {
    voiceId: voiceIdDropdown,
  },
  async run({ propsValue, auth }) {
    const { voiceId } = propsValue;

    if (!voiceId) {
      throw new Error('Voice ID is required');
    }

    return await retellAiApiCall({
      method: HttpMethod.GET,
      url: `/get-voice/${encodeURIComponent(voiceId)}`,
      auth: auth,
    });
  },
});