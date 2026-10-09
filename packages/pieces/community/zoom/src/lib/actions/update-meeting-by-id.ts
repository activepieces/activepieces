import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zoomAuth } from '../..';
import { zoomClient } from '../common/client';
import { zoomProps } from '../common/props';
import { updateMeetingByIdOutputSchema } from '../output-schemas';

export const zoomUpdateMeetingById = createAction({
  auth: zoomAuth,
  name: 'zoom_update_meeting_by_id',
  displayName: 'Update Meeting (by ID)',
  description: 'Change a meeting by its meeting ID. Only the fields you fill in are changed.',
  classification: 'WRITE',
  audience: 'ai',
  aiMetadata: {
    description: "Changes an existing meeting's topic, start time, duration, timezone, agenda, passcode or settings; omitted fields stay as they are and Clear Agenda blanks the agenda. Use to reschedule or reconfigure a meeting; target one occurrence of a recurring meeting with occurrence_id. Repeating the call with the same values gives the same meeting, so it is idempotent.",
    idempotent: true,
  },
  outputSchema: updateMeetingByIdOutputSchema,
  props: {
    meeting_id: zoomProps.meetingId({ description: 'The numeric Zoom meeting ID to change, for example 85746065432.' }),
    occurrence_id: zoomProps.occurrenceId(),
    topic: Property.ShortText({ displayName: 'Topic', description: 'New meeting topic.', required: false }),
    start_time: Property.ShortText({
      displayName: 'Start Time',
      description: 'New start date-time, for example 2026-11-01T15:00:00 (read in the meeting timezone) or 2026-11-01T15:00:00Z (UTC).',
      required: false,
    }),
    duration: Property.Number({ displayName: 'Duration (minutes)', description: 'New duration in minutes.', required: false }),
    timezone: Property.ShortText({ displayName: 'Timezone', description: 'IANA timezone, for example America/New_York.', required: false }),
    agenda: Property.LongText({ displayName: 'Agenda', description: 'New agenda text.', required: false }),
    clear_agenda: Property.Checkbox({
      displayName: 'Clear Agenda',
      description: 'Turn on to remove the current agenda. Ignored when Agenda is filled in.',
      required: false,
      defaultValue: false,
    }),
    password: Property.ShortText({
      displayName: 'Passcode',
      description: 'New passcode: up to 10 characters, letters, numbers and @ - _ * only.',
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
    host_video: Property.Checkbox({ displayName: 'Host Video', description: 'Start video when the host joins.', required: false }),
    participant_video: Property.Checkbox({ displayName: 'Participant Video', description: 'Start video when participants join.', required: false }),
    join_before_host: Property.Checkbox({ displayName: 'Join Before Host', description: 'Let participants join before the host.', required: false }),
    mute_upon_entry: Property.Checkbox({ displayName: 'Mute Upon Entry', description: 'Mute participants when they join.', required: false }),
    waiting_room: Property.Checkbox({ displayName: 'Waiting Room', description: 'Turn the waiting room on or off.', required: false }),
  },
  async run(context) {
    const meetingId = zoomClient.normalizeMeetingId(context.propsValue.meeting_id);
    const body = buildUpdateBody({ propsValue: context.propsValue });
    const updatedFields = [
      ...Object.keys(body).filter((key) => key !== 'settings'),
      ...Object.keys(zoomClient.isRecord(body['settings']) ? body['settings'] : {}).map((key) => `settings.${key}`),
    ];
    if (updatedFields.length === 0) {
      throw new Error('Nothing to update: fill in at least one field to change (or turn on Clear Agenda).');
    }
    const occurrenceId = zoomClient.optionalText(context.propsValue.occurrence_id);
    await zoomClient.request({
      accessToken: context.auth.access_token,
      method: HttpMethod.PATCH,
      path: `/meetings/${meetingId}`,
      query: { occurrence_id: occurrenceId },
      body,
      scope: 'meeting:update:meeting',
    });
    return {
      success: true,
      meeting_id: meetingId,
      occurrence_id: occurrenceId ?? null,
      updated_fields: updatedFields,
    };
  },
});

function buildUpdateBody({ propsValue }: { propsValue: UpdateProps }): Record<string, unknown> {
  const topic = zoomClient.optionalText(propsValue.topic);
  const startTime = zoomClient.optionalText(propsValue.start_time);
  const timezone = zoomClient.optionalText(propsValue.timezone);
  const password = zoomClient.optionalText(propsValue.password);
  const agenda = typeof propsValue.agenda === 'string' && propsValue.agenda.length > 0 ? propsValue.agenda : undefined;
  if (propsValue.duration !== undefined && propsValue.duration !== null && (!Number.isInteger(propsValue.duration) || propsValue.duration < 0)) {
    throw new Error('Duration must be a whole number of minutes.');
  }
  const settingEntries = Object.entries({
    auto_recording: propsValue.auto_recording,
    audio: propsValue.audio,
    host_video: propsValue.host_video,
    participant_video: propsValue.participant_video,
    join_before_host: propsValue.join_before_host,
    mute_upon_entry: propsValue.mute_upon_entry,
    waiting_room: propsValue.waiting_room,
  }).filter(([, value]) => value !== undefined && value !== null && value !== '');
  return {
    ...(topic !== undefined ? { topic } : {}),
    ...(startTime !== undefined ? { start_time: startTime } : {}),
    ...(typeof propsValue.duration === 'number' ? { duration: propsValue.duration } : {}),
    ...(timezone !== undefined ? { timezone } : {}),
    ...(agenda !== undefined ? { agenda } : propsValue.clear_agenda === true ? { agenda: '' } : {}),
    ...(password !== undefined ? { password } : {}),
    ...(settingEntries.length > 0 ? { settings: Object.fromEntries(settingEntries) } : {}),
  };
}

type UpdateProps = {
  topic?: string;
  start_time?: string;
  duration?: number | null;
  timezone?: string;
  agenda?: string;
  clear_agenda?: boolean;
  password?: string;
  auto_recording?: string;
  audio?: string;
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  waiting_room?: boolean;
};
