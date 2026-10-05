import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { listPastParticipantsOutputSchema } from '../output-schemas';

export const zoomListPastMeetingParticipants = createAction({
  auth: zoomAuth,
  name: 'zoom_list_past_meeting_participants',
  displayName: 'List Past Meeting Participants',
  description: 'List who joined an ended meeting (paid Zoom plan).',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists who joined an ended Zoom meeting instance with join and leave times and duration, one page at a time with a next_page_token. Use for attendance tracking after a meeting; needs a paid host. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listPastParticipantsOutputSchema,
  props: {
    meeting: zoomProps.meetingIdOrUuid({ description: 'A meeting UUID from List Past Meeting Instances (for one specific past instance), or a numeric meeting ID (for its most recent instance).' }),
    page_size: zoomProps.pageSize(),
    next_page_token: zoomProps.nextPageToken(),
  },
  async run(context) {
    const meetingPath = zoomClient.meetingIdOrUuidPath(context.propsValue.meeting);
    const pageSize = zoomClient.pageSizeOf({ value: context.propsValue.page_size, fallback: 30 });
    const body = await zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/past_meetings/${meetingPath}/participants`,
      query: {
        page_size: pageSize,
        next_page_token: zoomClient.optionalText(context.propsValue.next_page_token),
      },
      scope: 'meeting:read:list_past_participants',
    });
    return zoomClient.listPage({ body, itemsKey: 'participants' });
  },
});
