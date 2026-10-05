import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { getPastMeetingOutputSchema } from '../output-schemas';

export const zoomGetPastMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_get_past_meeting',
  displayName: 'Get Past Meeting',
  description: 'Get the details of an ended meeting (paid Zoom plan).',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description: 'Returns details of an ended Zoom meeting instance: start and end time, duration, participant count and host. Use with a UUID for one specific instance or a numeric meeting ID for the latest one; needs a paid host. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: getPastMeetingOutputSchema,
  props: {
    meeting: zoomProps.meetingIdOrUuid({ description: 'A meeting UUID from List Past Meeting Instances (for one specific past instance), or a numeric meeting ID (for its most recent instance).' }),
  },
  async run(context) {
    const meetingPath = zoomClient.meetingIdOrUuidPath(context.propsValue.meeting);
    return zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/past_meetings/${meetingPath}`,
      scope: 'meeting:read:past_meeting',
    });
  },
});
