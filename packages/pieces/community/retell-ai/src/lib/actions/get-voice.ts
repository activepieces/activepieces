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
  audience: 'both',
  aiMetadata: { description: 'Look up the details of a single Retell voice by its Voice ID, such as provider, accent, gender, and preview. Use to inspect a voice before assigning it to an agent. Read-only and idempotent.', idempotent: true },
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