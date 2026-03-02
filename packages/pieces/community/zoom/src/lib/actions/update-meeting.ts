import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { MeetingMessageBody } from '../common/models';
import { zoomAuth } from '../..';

export const zoomUpdateMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_update_meeting',
  displayName: 'Update Zoom Meeting',
  description: 'Update the details of an existing meeting.',
  props: {
    meeting_id: Property.ShortText({
      displayName: 'Meeting ID',
      description: 'The meeting ID to update (numeric ID without spaces, e.g., 89434225642). You can find this in the Zoom meeting URL or meeting invitation.',
      required: true,
    }),
    topic: Property.ShortText({
      displayName: "Meeting's topic",
      description: "The meeting's topic",
      required: false,
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'Meeting start date-time (ISO 8601 format, e.g., 2023-05-01T12:00:00Z)',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (in Minutes)',
      description: 'Duration of the meeting',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone for the meeting (e.g., UTC, America/New_York)',
      required: false,
    }),
    auto_recording: Property.StaticDropdown({
      displayName: 'Auto Recording',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Local', value: 'local' },
          { label: 'Cloud', value: 'cloud' },
          { label: 'None', value: 'none' },
        ],
      },
    }),
    audio: Property.StaticDropdown({
      displayName: 'Audio',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Both telephony and VoIP', value: 'both' },
          { label: 'Telephony only', value: 'telephony' },
          { label: 'VoIP only', value: 'voip' },
          { label: 'Third party audio conference', value: 'thirdParty' },
        ],
      },
    }),
    agenda: Property.LongText({
      displayName: 'Agenda',
      description: "The meeting's agenda",
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Password',
      description:
        'The password required to join the meeting. By default, a password can only have a maximum length of 10 characters and only contain alphanumeric characters and the @, -, _, and * characters.',
      required: false,
    }),
    host_video: Property.Checkbox({
      displayName: 'Host Video',
      description: 'Whether to start video when the host joins the meeting.',
      required: false,
    }),
    participant_video: Property.Checkbox({
      displayName: 'Participant Video',
      description: 'Whether to start video when participants join the meeting.',
      required: false,
    }),
    join_before_host: Property.Checkbox({
      displayName: 'Join Before Host',
      description: 'Whether participants can join the meeting before the host starts the meeting.',
      required: false,
    }),
    mute_upon_entry: Property.Checkbox({
      displayName: 'Mute Upon Entry',
      description: 'Whether to mute participants upon entry.',
      required: false,
    }),
    waiting_room: Property.Checkbox({
      displayName: 'Waiting Room',
      description: 'Whether to enable waiting room.',
      required: false,
    }),
  },
  async run(context) {
    // Clean the meeting ID by removing spaces and special characters
    const cleanMeetingId = context.propsValue.meeting_id.replace(/\s+/g, '').replace(/[^\d]/g, '');
    
    // Build the request body with only the provided values
    const body: Partial<MeetingMessageBody> = {};
    
    if (context.propsValue.topic) body.topic = context.propsValue.topic;
    if (context.propsValue.start_time) body.start_time = context.propsValue.start_time;
    if (context.propsValue.duration) body.duration = context.propsValue.duration;
    if (context.propsValue.timezone) body.timezone = context.propsValue.timezone;
    if (context.propsValue.agenda) body.agenda = context.propsValue.agenda;
    if (context.propsValue.password) body.password = context.propsValue.password;

    // Build settings object only if there are settings to update
    const settings: Partial<MeetingMessageBody['settings']> = {};
    let hasSettings = false;

    if (context.propsValue.auto_recording) {
      settings.auto_recording = context.propsValue.auto_recording;
      hasSettings = true;
    }
    if (context.propsValue.audio) {
      settings.audio = context.propsValue.audio;
      hasSettings = true;
    }
    if (context.propsValue.host_video !== undefined) {
      settings.host_video = context.propsValue.host_video;
      hasSettings = true;
    }
    if (context.propsValue.participant_video !== undefined) {
      settings.participant_video = context.propsValue.participant_video;
      hasSettings = true;
    }
    if (context.propsValue.join_before_host !== undefined) {
      settings.join_before_host = context.propsValue.join_before_host;
      hasSettings = true;
    }
    if (context.propsValue.mute_upon_entry !== undefined) {
      settings.mute_upon_entry = context.propsValue.mute_upon_entry;
      hasSettings = true;
    }
    if (context.propsValue.waiting_room !== undefined) {
      settings.waiting_room = context.propsValue.waiting_room;
      hasSettings = true;
    }

    if (hasSettings) {
      body.settings = settings as MeetingMessageBody['settings'];
    }

    const request: HttpRequest<Partial<MeetingMessageBody>> = {
      method: HttpMethod.PATCH,
      url: `https://api.zoom.us/v2/meetings/${cleanMeetingId}`,
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    };

    const result = await httpClient.sendRequest(request);
    
    if (result.status === 204) {
      // Zoom API returns 204 No Content for successful updates
      return { success: true, message: 'Meeting updated successfully' };
    } else if (result.status === 404) {
      return {
        error: 'Meeting not found',
        message: `No meeting found with ID: ${cleanMeetingId}. Please verify the meeting ID is correct and that you have permission to update this meeting.`,
        originalResponse: result
      };
    } else {
      return {
        error: 'API Error',
        message: 'An error occurred while updating the meeting.',
        response: result
      };
    }
  },
});
