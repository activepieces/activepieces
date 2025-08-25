import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth, retellCommon } from '../common';

export const getCall = createAction({
  auth: retellAiAuth,
  name: 'getCall',
  displayName: 'Get a Call',
  description:
    'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID.',
  props: retellCommon.getCallProperties(),
  async run({ auth: apiKey, propsValue: { callId } }) {
    return await retellCommon.getCall({ apiKey, callId });
  },
});
