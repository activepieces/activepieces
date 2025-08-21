import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellAiApi, retellAiCommon } from '../common';

export const getVoice = createAction({
  auth: retellAiAuth,
  name: 'get_voice',
  displayName: 'Get a Voice',
  description: 'Retrieve details for a specific voice model or configuration by ID in Retell AI',
  props: {
    voice_id: retellAiCommon.voice_id,
  },
  async run(context) {
    const { voice_id } = context.propsValue;

    const response = await retellAiApi.get(`/v2/get-voice`, context.auth, { voice_id });
    return response;
  },
});
