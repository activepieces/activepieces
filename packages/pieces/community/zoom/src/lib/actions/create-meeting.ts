import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MeetingMessageBody } from '../common/models';
import { zoomClient } from '../common/client';
import { createMeetingOutputSchema } from '../output-schemas';
import { zoomAuth } from '../..';

const action = () => {
  return createAction({
    auth: zoomAuth,
    name: 'zoom_create_meeting',
    classification: 'WRITE',
    displayName: 'Create Zoom Meeting',
    description: 'Create a new Zoom Meeting',
    audience: 'both',
    aiMetadata: { description: 'Schedules a new Zoom meeting on the authenticated user\'s account, returning the meeting ID and join URL. Use to set up a video call; only the topic is required, with optional start time and timezone, duration, password, sign-in requirement and audio/recording settings. Each call creates a distinct meeting, so it is not idempotent.', idempotent: false },
    outputSchema: createMeetingOutputSchema,
    props: {
      topic: Property.ShortText({
        displayName: "Meeting's topic",
        description: "The meeting's topic",
        required: true,
      }),
      start_time: Property.ShortText({
        displayName: 'Start Time',
        description: 'Meeting start date-time, for example 2026-11-01T15:00:00 (read in the Timezone below) or 2026-11-01T15:00:00Z (UTC).',
        required: false,
      }),
      timezone: Property.ShortText({
        displayName: 'Timezone',
        description: 'IANA timezone for the start time, for example America/New_York. Defaults to UTC.',
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
        description: 'Not used by Zoom (kept for compatibility). Zoom creates the join URL and returns it in the output.',
        required: false,
      }),
      require_authentication: Property.Checkbox({
        displayName: 'Require Zoom Sign-in to Join',
        description: 'When on, only participants signed in to a Zoom account can join. Turn off to let anyone with the link join.',
        required: false,
        defaultValue: true,
      }),
    },
    async run(context) {
      const body = buildCreateMeetingBody({ propsValue: context.propsValue });
      const response = await zoomClient.requestObject({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        path: '/users/me/meetings',
        body,
        scope: 'meeting:write:meeting',
      });
      return response;
    },
  });
};

export const zoomCreateMeeting = action();

function buildCreateMeetingBody({ propsValue }: { propsValue: CreateMeetingProps }): MeetingMessageBody {
  const settings: MeetingMessageBody['settings'] = {
    allow_multiple_devices: true,
    approval_type: 2,
    audio: propsValue.audio ?? 'telephony',
    calendar_type: 1,
    close_registration: false,
    email_notification: true,
    host_video: true,
    join_before_host: false,
    meeting_authentication: propsValue.require_authentication ?? true,
    mute_upon_entry: false,
    participant_video: false,
    private_meeting: false,
    registrants_confirmation_email: true,
    registrants_email_notification: true,
    registration_type: 1,
    show_share_button: true,
    host_save_video_order: true,
    ...(propsValue.auto_recording ? { auto_recording: propsValue.auto_recording } : {}),
  };
  const startTime = zoomClient.optionalText(propsValue.start_time);
  const password = zoomClient.optionalText(propsValue.password);
  const scheduleFor = zoomClient.optionalText(propsValue.schedule_for);
  return {
    topic: propsValue.topic,
    type: 2,
    agenda: zoomClient.optionalText(propsValue.agenda) ?? 'My Meeting',
    default_password: false,
    duration: typeof propsValue.duration === 'number' ? propsValue.duration : 30,
    pre_schedule: propsValue.pre_schedule ?? false,
    timezone: zoomClient.optionalText(propsValue.timezone) ?? 'UTC',
    ...(startTime ? { start_time: startTime } : {}),
    ...(password ? { password } : {}),
    ...(scheduleFor ? { schedule_for: scheduleFor } : {}),
    settings,
  };
}

type CreateMeetingProps = {
  topic: string;
  start_time?: string;
  timezone?: string;
  duration?: number;
  auto_recording?: string;
  audio?: string;
  agenda?: string;
  password?: string;
  pre_schedule?: boolean;
  schedule_for?: string;
  require_authentication?: boolean;
};
