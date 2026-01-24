import { createAction } from '@activepieces/pieces-framework';
import { meetgeekaiAuth } from '../common/auth';
import { meetingIdDropdwon } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getMeetingsSummaryInsights = createAction({
  auth: meetgeekaiAuth,
  name: 'getMeetingsSummaryInsights',
  displayName: 'Get Meeting Summary & AI Insights',
  description: 'Retrieves the meeting summary and AI-generated insights',
  props: {
    meetingId: meetingIdDropdwon,
  },
  async run(context) {
    const { meetingId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.GET,
      `/meetings/${meetingId}/summary`
    );

    return response;
  },
});
