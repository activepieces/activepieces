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
        displayName: 'Topic',
        description: 'Shown as the meeting title in Zoom and in invites.',
        placeholder: 'Weekly team sync',
        required: true,
      }),
      start_time: Property.ShortText({
        displayName: 'Start Time',
        description: 'Read in the Timezone field; end it with Z for UTC.',
        placeholder: '2026-11-01T15:00:00',
        required: false,
      }),
      timezone: Property.ShortText({
        displayName: 'Timezone',
        description: 'IANA timezone name. Defaults to UTC.',
        placeholder: 'America/New_York',
        required: false,
        width: 'half',
      }),
      duration: Property.Number({
        displayName: 'Duration',
        description: 'Length in minutes. Defaults to 30.',
        required: false,
        width: 'half',
      }),
      auto_recording: Property.StaticDropdown({
        displayName: 'Auto Recording',
        description: 'Record the meeting automatically, locally or to the cloud.',
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
        description: 'How people join the audio. Defaults to Telephony only.',
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
        description: 'Meeting description. Defaults to "My Meeting".',
        required: false,
      }),
      password: Property.ShortText({
        displayName: 'Passcode',
        description: 'Up to 10 characters: letters, numbers and @ - _ *.',
        required: false,
      }),
      pre_schedule: Property.Checkbox({
        displayName: 'Pre-schedule',
        description: 'Only for meetings made with the Zoom for Google Workspace app.',
        required: false,
        advanced: true,
      }),
      schedule_for: Property.ShortText({
        displayName: 'Schedule For',
        description: 'Email or user ID of the host. Needs Zoom scheduling privilege.',
        placeholder: 'colleague@example.com',
        required: false,
        advanced: true,
      }),
      join_url: Property.LongText({
        displayName: 'Join URL',
        description: 'Not used: Zoom creates the join URL and returns it in the output.',
        required: false,
        advanced: true,
      }),
      require_authentication: Property.Checkbox({
        displayName: 'Require Zoom Sign-in to Join',
        description: 'Only people signed in to Zoom can join. Off: anyone with the link.',
        required: false,
        defaultValue: true,
      }),
    },
    propertyGroups: [
      { key: 'meeting', display: 'section', label: 'Meeting', icon: 'text', props: ['topic', 'agenda'] },
      { key: 'when', display: 'section', label: 'When', icon: 'calendar', props: ['start_time', 'timezone', 'duration'] },
      { key: 'access', display: 'section', label: 'Who Can Join', icon: 'users', props: ['password', 'require_authentication'] },
      { key: 'in_meeting', display: 'section', label: 'In the Meeting', icon: 'sliders', props: ['audio', 'auto_recording'] },
    ],
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
