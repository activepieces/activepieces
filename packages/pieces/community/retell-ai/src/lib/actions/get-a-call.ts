import { createAction, Property } from '@activepieces/pieces-framework';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const getACall = createAction({
  auth: RetllAiAuth,
  name: 'getACall',
  displayName: 'Get a Call',
  description:
    'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID',
  props: {
    callId: callIdDropdown,
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/v2/get-call/${propsValue.callId}`,
      undefined
    );

    return response;
  },
});
