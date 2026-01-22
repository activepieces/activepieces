import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';
import { callIdDropdown } from '../common/props';

export const getCall = createAction({
  auth: retellAiAuth,
  name: 'get_call',
  displayName: 'Get Call',
  description: 'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID.',
  props: {
    callId: callIdDropdown,
  },
  async run({ propsValue, auth }) {
    const { callId } = propsValue;

    if (!callId) {
      throw new Error('Call ID is required');
    }

    return await retellAiApiCall({
      method: HttpMethod.GET,
      url: `/v2/get-call/${callId}`,
      auth: auth,
    });
  },
});