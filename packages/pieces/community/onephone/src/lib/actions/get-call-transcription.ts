import { createAction, Property } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { callIdDropdown } from '../common/props';

export const getCallTranscription = createAction({
  auth: OpenPhoneAuth,
  name: 'getCallTranscription',
  displayName: 'Get Call Transcription',
  description:
    'Get  transcription for a specific call in OpenPhone',
  props: {
    callId: callIdDropdown,
  },
  async run({ auth, propsValue }) {
    const { callId } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/calls/${callId}/transcription`,
      undefined
    );

    return response;
  },
});
