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
  audience: 'both',
  aiMetadata: {
    description: 'Fetch the full transcript (all sentences) for a single MeetGeek meeting by its meeting ID. Use when an agent needs the verbatim spoken content rather than a summary or highlights. Read-only and idempotent.',
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
      `/meetings/${meetingId}/transcript`
    );

    return response;
  },
});
