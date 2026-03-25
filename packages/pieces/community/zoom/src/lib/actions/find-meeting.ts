import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { MeetingResponseBody } from '../common/models';
import { zoomMeetingDropdown } from '../common/props';
import { zoomAuth } from '../..';

export const zoomFindMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_find_meeting',
  displayName: 'Find Zoom Meeting',
  description: 'Retrieve the details of an existing meeting or webinar.',
  props: {
    meeting_id: zoomMeetingDropdown,
    occurrence_id: Property.ShortText({
      displayName: 'Occurrence ID',
      description:
        'Meeting Occurrence ID. Provide this field to view meeting details of a particular occurrence of the recurring meeting.',
      required: false,
    }),
    show_previous_occurrences: Property.Checkbox({
      displayName: 'Show Previous Occurrences',
      description:
        'Set to true if you would like to view meeting details of all previous occurrences of a recurring meeting.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const cleanMeetingId = context.propsValue.meeting_id;

    const queryParams: Record<string, string> = {};

    if (context.propsValue.occurrence_id) {
      queryParams['occurrence_id'] = context.propsValue.occurrence_id;
    }

    if (context.propsValue.show_previous_occurrences) {
      queryParams['show_previous_occurrences'] = 'true';
    }

    const result = await httpClient.sendRequest<MeetingResponseBody>({
      method: HttpMethod.GET,
      url: `https://api.zoom.us/v2/meetings/${cleanMeetingId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams,
    });

    return result.body;
  },
});
