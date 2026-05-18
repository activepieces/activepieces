import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { MeetingMessageBody, MeetingResponseBody } from '../common/models';
import { zoomAuth } from '../..';

const defaults = {
  agenda: 'My Meeting',
  default_password: false,
  duration: 30,
  pre_schedule: false,

  settings: {
    allow_multiple_devices: true,
    approval_type: 2,
    audio: 'telephony',

    calendar_type: 1,
    close_registration: false,

    email_notification: true,
    host_video: true,
    join_before_host: false,
    meeting_authentication: true,
    mute_upon_entry: false,
    participant_video: false,
    private_meeting: false,
    registrants_confirmation_email: true,
    registrants_email_notification: true,
    registration_type: 1,
    show_share_button: true,
    host_save_video_order: true,
  },

  timezone: 'UTC',
  type: 2,
};

const action = () => {
  return createAction({
    auth: zoomAuth,
    name: 'zoom_create_meeting', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Create Zoom Meeting',
    description: 'Create a new Zoom Meeting',
    props: {
      topic: Property.ShortText({
        displayName: "Meeting's topic",
        description: "The meeting's topic",
        required: true,
      }),
      start_time: Property.ShortText({
        displayName: 'Start Time',
        description: 'Meeting start date-time',
        required: false,
      }),
      duration: Property.Number({
        displayName: 'Duration (in Minutes)',
        description: 'Duration of the meeting',
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
      pre_schedule: Property.Checkbox({
        displayName: 'Pre Schedule',
        description:
          'Whether the prescheduled meeting was created via the GSuite app.',
        required: false,
      }),
      schedule_for: Property.ShortText({
        displayName: 'Schedule for',
        description:
          'The email address or user ID of the user to schedule a meeting for.',
        required: false,
      }),
      join_url: Property.LongText({
        displayName: 'Join URL',
        description: 'URL for participants to join the meeting.',
        required: false,
      }),
    },
    async run(context) {
      const body: MeetingMessageBody = {
        ...defaults,
        ...context.propsValue,
      };

      if (context.propsValue.auto_recording) {
        body.settings.auto_recording = context.propsValue.auto_recording;
      }

      if (context.propsValue.audio) {
        body.settings.audio = context.propsValue.audio;
      }
      delete body['auth'];
      const request: HttpRequest<MeetingMessageBody> = {
        method: HttpMethod.POST,
        url: `https://api.zoom.us/v2/users/me/meetings`,
        body: body,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
        queryParams: {},
      };

      const result = await httpClient.sendRequest<MeetingResponseBody>(request);

      if (result.status === 201) {
        return result.body;
      } else {
        return result;
      }
    },
  });
};

export const zoomCreateMeeting = action();
