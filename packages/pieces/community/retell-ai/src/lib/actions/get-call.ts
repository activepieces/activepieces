import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiApiCall } from '../common/client';
import { retellAiAuth } from '../common/auth';

export const getCall = createAction({
  auth: retellAiAuth,
  name: 'get_call',
  displayName: 'Get Call',
  description: 'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID.',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The call id to retrieve call history for. Example: "119c3f8e47135a29e65947eeb34cf12d"',
      required: true,
    }),
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