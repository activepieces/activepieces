import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { listPastMeetingInstancesOutputSchema } from '../output-schemas';

export const zoomListPastMeetingInstances = createAction({
  auth: zoomAuth,
  name: 'zoom_list_past_meeting_instances',
  displayName: 'List Past Meeting Instances',
  description: 'List the ended instances (UUID and start time) of a meeting.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the ended instances (UUID and start time) of a Zoom meeting ID. Use to find when a meeting, or each occurrence of a recurring meeting, actually took place and get each instance UUID. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listPastMeetingInstancesOutputSchema,
  props: {
    meeting_id: zoomProps.meetingId({ description: 'The numeric Zoom meeting ID, for example 85746065432.' }),
  },
  async run(context) {
    const meetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);
    const body = await zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/past_meetings/${meetingId}/instances`,
      scope: 'meeting:read:list_past_instances',
    });
    return { meeting_id: meetingId, meetings: Array.isArray(body['meetings']) ? body['meetings'] : [] };
  },
});
