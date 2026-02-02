import { createAction } from '@activepieces/pieces-framework';
import { meetgeekaiAuth } from '../common/auth';
import { meetingIdDropdwon } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getHighlights = createAction({
  auth: meetgeekaiAuth,
  name: 'getHighlights',
  displayName: 'Get Highlights',
  description: 'Retrieves all highlights for a meeting by meeting ID',
  props: {
    meetingId: meetingIdDropdwon,
  },
  async run(context) {
    const { meetingId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/meetings/${meetingId}/highlights`
    );

    return response;
  },
});
