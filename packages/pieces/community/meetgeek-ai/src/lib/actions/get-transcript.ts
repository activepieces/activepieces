import { createAction, Property } from '@activepieces/pieces-framework';
import { meetgeekaiAuth } from '../common/auth';
import { meetingIdDropdwon } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getTranscript = createAction({
  auth: meetgeekaiAuth,
  name: 'getTranscript',
  displayName: 'Get Transcript',
  description:
    'Retrieves all transcript sentences for a meeting with pagination support',
  props: {
    meetingId: meetingIdDropdwon,
  },
  async run(context) {
    const { meetingId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/meetings/${meetingId}/transcript`
    );

    return response;
  },
});
