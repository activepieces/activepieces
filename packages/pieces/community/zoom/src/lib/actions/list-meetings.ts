import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { listMeetingsOutputSchema } from '../output-schemas';

export const zoomListMeetings = createAction({
  auth: zoomAuth,
  name: 'zoom_list_meetings',
  displayName: 'List Meetings',
  description: 'List the meetings of the connected Zoom user, one page at a time.',
  classification: 'SEARCH',
  audience: 'both',
  aiMetadata: {
    description: "Lists the connected user's meetings of one type (scheduled, live, upcoming or previous), one page at a time with a next_page_token. Use to find a meeting ID before getting, updating or deleting it. Read-only and idempotent.",
    idempotent: true,
  },
  outputSchema: listMeetingsOutputSchema,
  props: {
    type: Property.StaticDropdown({
      displayName: 'Meeting Type',
      description: 'Which meetings to list.',
      required: false,
      defaultValue: 'scheduled',
      options: {
        disabled: false,
        options: [
          { label: 'Scheduled (all valid scheduled meetings)', value: 'scheduled' },
          { label: 'Live (in progress)', value: 'live' },
          { label: 'Upcoming', value: 'upcoming' },
          { label: 'Upcoming meetings (from today)', value: 'upcoming_meetings' },
          { label: 'Previous meetings', value: 'previous_meetings' },
        ],
      },
    }),
    page_size: zoomProps.pageSize(),
    next_page_token: zoomProps.nextPageToken(),
  },
  async run(context) {
    const pageSize = zoomClient.pageSizeOf({ value: context.propsValue.page_size, fallback: 30 });
    const body = await zoomClient.requestObject({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      path: '/users/me/meetings',
      query: {
        type: zoomClient.optionalText(context.propsValue.type) ?? 'scheduled',
        page_size: pageSize,
        next_page_token: zoomClient.optionalText(context.propsValue.next_page_token),
      },
      scope: 'meeting:read:list_meetings',
    });
    return zoomClient.listPage({ body, itemsKey: 'meetings' });
  },
});
