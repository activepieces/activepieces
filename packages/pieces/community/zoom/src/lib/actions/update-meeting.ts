import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { MeetingMessageBody } from '../common/models';
import { zoomMeetingDropdown } from '../common/props';
import { zoomClient } from '../common/client';
import { updateMeetingOutputSchema } from '../output-schemas';
import { zoomAuth } from '../..';

export const zoomUpdateMeeting = createAction({
  auth: zoomAuth,
  name: 'zoom_update_meeting',
  classification: 'WRITE',
  displayName: 'Update Zoom Meeting',
  description: 'Update the details of an existing meeting.',
  audience: 'human',
  aiMetadata: { description: 'Modifies an existing Zoom meeting identified by its meeting ID, applying only the fields you supply (topic, start time, duration, timezone, password, and audio/video/recording/waiting-room settings). Use to reschedule or reconfigure a meeting. Repeating the call with the same values produces the same end state, so it is idempotent.', idempotent: true },
  outputSchema: updateMeetingOutputSchema,
  props: {
    changes_info: Property.MarkDown({
      value: 'Empty text and dropdown fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    settings_warning: Property.MarkDown({
      value: 'Every on/off switch below is sent on each run: set each one as the meeting needs it.',
      variant: MarkdownVariant.WARNING,
    }),
    meeting_id: zoomMeetingDropdown,
    topic: Property.ShortText({
      displayName: 'Topic',
      placeholder: 'Weekly team sync',
      required: false,
    }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'Read in the Timezone field; end it with Z for UTC.',
      placeholder: '2026-11-01T15:00:00',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration',
      description: 'Length in minutes.',
      required: false,
      width: 'half',
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone name.',
      placeholder: 'America/New_York',
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
      description: 'How people join the audio.',
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
      description: 'Meeting description.',
      required: false,
    }),
    password: Property.ShortText({
      displayName: 'Passcode',
      description: 'Up to 10 characters: letters, numbers and @ - _ *.',
      required: false,
    }),
    host_video: Property.Checkbox({
      displayName: 'Host Video',
      description: 'Start video when the host joins.',
      required: false,
    }),
    participant_video: Property.Checkbox({
      displayName: 'Participant Video',
      description: 'Start video when participants join.',
      required: false,
    }),
    join_before_host: Property.Checkbox({
      displayName: 'Join Before Host',
      description: 'Let participants join before the host.',
      required: false,
    }),
    mute_upon_entry: Property.Checkbox({
      displayName: 'Mute Upon Entry',
      description: 'Mute participants when they join.',
      required: false,
    }),
    waiting_room: Property.Checkbox({
      displayName: 'Waiting Room',
      description: 'Turn the waiting room on or off.',
      required: false,
    }),
  },
  propertyGroups: [
    { key: 'meeting', display: 'section', label: 'Meeting', icon: 'text', props: ['changes_info', 'meeting_id', 'topic', 'agenda'] },
    { key: 'when', display: 'section', label: 'When', icon: 'calendar', props: ['start_time', 'timezone', 'duration'] },
    { key: 'access', display: 'section', label: 'Who Can Join', icon: 'users', props: ['settings_warning', 'password', 'join_before_host', 'waiting_room'] },
    { key: 'in_meeting', display: 'section', label: 'In the Meeting', icon: 'sliders', props: ['audio', 'auto_recording', 'host_video', 'participant_video', 'mute_upon_entry'] },
  ],
  async run(context) {
    const cleanMeetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);

    const body: Partial<MeetingMessageBody> = {};

    if (context.propsValue.topic) body.topic = context.propsValue.topic;
    if (context.propsValue.start_time)
      body.start_time = context.propsValue.start_time;
    if (context.propsValue.duration)
      body.duration = context.propsValue.duration;
    if (context.propsValue.timezone)
      body.timezone = context.propsValue.timezone;
    if (context.propsValue.agenda) body.agenda = context.propsValue.agenda;
    if (context.propsValue.password)
      body.password = context.propsValue.password;

    const settings: MeetingMessageBody['settings'] = {};
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
      body.settings = settings;
    }

    await zoomClient.request({
      accessToken: context.auth.access_token,
      method: HttpMethod.PATCH,
      path: `/meetings/${cleanMeetingId}`,
      body,
      scope: 'meeting:update:meeting',
    });

    return { success: true, message: 'Meeting updated successfully', meeting_id: cleanMeetingId };
  },
});
