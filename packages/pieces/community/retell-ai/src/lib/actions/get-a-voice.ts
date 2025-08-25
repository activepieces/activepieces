import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { voiceIdDropdown } from '../common/props';

export const getAVoice = createAction({
  auth: RetllAiAuth,
  name: 'getAVoice',
  displayName: 'Get a Voice',
  description: 'Retrieve details for a specific voice model or configuration by ID in Retell AI',
  props: {
    voiceId: voiceIdDropdown,
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/get-voice/${propsValue.voiceId}`,
      undefined
    );

    return response;
  },
});