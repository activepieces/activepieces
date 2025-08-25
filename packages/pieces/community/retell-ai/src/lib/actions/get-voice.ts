import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellCommon } from '../common';

export const getVoice = createAction({
  auth: retellAiAuth,
  name: 'getVoice',
  displayName: 'Get a Voice',
  description:
    'Retrieve details for a specific voice model or configuration by ID in Retell AI.',
  props: retellCommon.getVoiceProperties(),
  async run({ auth: apiKey, propsValue: { voiceId } }) {
    return retellCommon.getVoice({ apiKey, voiceId });
  },
});
