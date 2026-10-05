import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { listRegistrantsOutputSchema } from '../output-schemas';

export const zoomListMeetingRegistrants = createAction({
  auth: zoomAuth,
  name: 'zoom_list_meeting_registrants',
  displayName: 'List Meeting Registrants',
  description: 'List the registrants of a meeting that has registration turned on (paid Zoom plan).',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: 'Lists registrants of a registration-enabled Zoom meeting filtered by status (pending, approved or denied), one page at a time with a next_page_token. Use to review who signed up before approving or denying them; registration needs a paid host. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listRegistrantsOutputSchema,
  props: {
    meeting_id: zoomProps.meetingId({ description: 'The numeric Zoom meeting ID, for example 85746065432.' }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Which registrants to list.',
      required: false,
      defaultValue: 'approved',
      options: {
        disabled: false,
        options: [
          { label: 'Approved', value: 'approved' },
          { label: 'Pending approval', value: 'pending' },
          { label: 'Denied', value: 'denied' },
        ],
      },
    }),
    occurrence_id: zoomProps.occurrenceId(),
    page_size: zoomProps.pageSize(),
    next_page_token: zoomProps.nextPageToken(),
  },
  async run(context) {
    const meetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);
    const pageSize = zoomClient.pageSizeOf({ value: context.propsValue.page_size, fallback: 30 });
    const body = await zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: `/meetings/${meetingId}/registrants`,
      query: {
        status: zoomClient.optionalText(context.propsValue.status) ?? 'approved',
        occurrence_id: zoomClient.optionalText(context.propsValue.occurrence_id),
        page_size: pageSize,
        next_page_token: zoomClient.optionalText(context.propsValue.next_page_token),
      },
      scope: 'meeting:read:list_registrants',
    });
    return zoomClient.listPage({ body, itemsKey: 'registrants' });
  },
});
