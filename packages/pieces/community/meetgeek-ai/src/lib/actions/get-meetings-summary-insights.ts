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
  audience: 'both',
  aiMetadata: {
    description: 'Fetch the AI-generated summary and insights for a single MeetGeek meeting by its meeting ID. Use to get a condensed overview rather than the full transcript. Read-only and idempotent.',
    idempotent: true,
  },
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
