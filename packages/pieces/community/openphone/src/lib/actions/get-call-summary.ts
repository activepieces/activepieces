import { createAction, Property } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const getCallSummary = createAction({
  auth: OpenPhoneAuth,
  name: 'getCallSummary',
  displayName: 'Get Call Summary',
  description: 'Get summary for a specific call in OpenPhone',
  props: {
    callId: callIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { callId } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/call-summaries/${callId}`,
      undefined
    );

    return response;
  },
});
