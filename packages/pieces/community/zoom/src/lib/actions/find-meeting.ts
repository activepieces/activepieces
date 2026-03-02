import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { MeetingResponseBody } from '../common/models';
import { zoomAuth } from '../..';

export const zoomFindMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_find_meeting',
  displayName: 'Find Zoom Meeting',
  description: 'Retrieve the details of an existing meeting or webinar.',
  props: {
    meeting_id: Property.ShortText({
      displayName: 'Meeting ID',
      description: 'The meeting ID (numeric ID without spaces, e.g., 89434225642) or Personal Meeting ID (PMI). You can find this in the Zoom meeting URL or meeting invitation.',
      required: true,
    }),
    occurrence_id: Property.ShortText({
      displayName: 'Occurrence ID',
      description: 'Meeting Occurrence ID. Provide this field to view meeting details of a particular occurrence of the recurring meeting.',
      required: false,
    }),
    show_previous_occurrences: Property.Checkbox({
      displayName: 'Show Previous Occurrences',
      description: 'Set to true if you would like to view meeting details of all previous occurrences of a recurring meeting.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    // Clean the meeting ID by removing spaces and special characters
    const cleanMeetingId = context.propsValue.meeting_id.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    const queryParams: Record<string, string> = {};
    
    if (context.propsValue.occurrence_id) {
      queryParams.occurrence_id = context.propsValue.occurrence_id;
    }
    
    if (context.propsValue.show_previous_occurrences) {
      queryParams.show_previous_occurrences = 'true';
    }

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.zoom.us/v2/meetings/${cleanMeetingId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams,
    };

    const result = await httpClient.sendRequest<MeetingResponseBody>(request);
    
    if (result.status === 200) {
      return result.body;
    } else if (result.status === 404) {
      return {
        error: 'Meeting not found',
        message: `No meeting found with ID: ${cleanMeetingId}. Please verify the meeting ID is correct and that you have permission to access this meeting.`,
        originalResponse: result
      };
    } else {
      return {
        error: 'API Error',
        message: 'An error occurred while fetching the meeting details.',
        response: result
      };
    }
  },
});
