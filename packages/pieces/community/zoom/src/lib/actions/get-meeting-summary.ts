import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { getMeetingSummaryOutputSchema } from '../output-schemas';

export const zoomGetMeetingSummary = createAction({
  auth: zoomAuth,
  name: 'zoom_get_meeting_summary',
  displayName: 'Get Meeting Summary (AI Companion)',
  description: 'Get the AI Companion summary of an ended meeting (paid Zoom plan with AI Companion meeting summaries on).',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the Zoom AI Companion summary of an ended meeting: overview, key points and next steps. Use to follow up on a meeting; requires a paid plan with AI Companion meeting summaries turned on during the meeting, otherwise Zoom returns not found. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getMeetingSummaryOutputSchema,
  props: {
    meeting: zoomProps.meetingIdOrUuid({ description: 'A meeting UUID from List Past Meeting Instances (for one specific past instance), or a numeric meeting ID (for its most recent instance).' }),
  },
  async run(context) {
    const meetingPath = zoomClient.meetingIdOrUuidPath(context.propsValue.meeting);
    return zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/meetings/${meetingPath}/meeting_summary`,
      scope: 'meeting:read:summary',
    });
  },
});
