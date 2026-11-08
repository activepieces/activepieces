import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { leexiAuth } from '../common/auth';
import { leexiApi } from '../common/client';
import { LeexiMeetingEvent } from '../common/types';
import { leexiOutputFields } from '../common/constants';

function toIso({ value, label }: { value: string; label: string }): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${label} "${value}". Use an ISO 8601 date such as 2026-01-31T10:00:00.000Z.`);
  }
  return date.toISOString();
}

function yesNoOptions() {
  return {
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  };
}

export const createMeetingEventAction = createAction({
  name: 'create_meeting_event',
  classification: 'WRITE',
  auth: leexiAuth,
  displayName: 'Create Meeting Event',
  description: 'Schedule a Zoom, Teams or Meet meeting for Leexi to record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a Leexi meeting event for a Zoom, Teams or Google Meet URL, owned by a Leexi user (user UUID from List Users), with start/end time, organizer email, optional attendees, title, description and direction. Set to_record=yes to have the Leexi assistant join and record it. Requires the write_meeting_events scope and a user with a transcription license. Not idempotent: Leexi rejects a second event with the same meeting URL and start time (409).',
    idempotent: false,
  },
  outputSchema: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'data', label: 'Meeting Event', children: leexiOutputFields.meetingEvent },
    ],
  },
  props: {
    meeting_url: Property.ShortText({
      displayName: 'Meeting URL',
      description: 'Zoom, Microsoft Teams or Google Meet link.',
      required: true,
    }),
    user_uuid: Property.ShortText({
      displayName: 'User UUID',
      description: 'Leexi user the meeting belongs to. Get it from List Users.',
      required: true,
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      description: 'Meeting start (ISO 8601).',
      required: true,
    }),
    end_time: Property.DateTime({
      displayName: 'End Time',
      description: 'Meeting end (ISO 8601).',
      required: true,
    }),
    organizer: Property.ShortText({
      displayName: 'Organizer Email',
      description: 'Email address of the meeting organizer.',
      required: true,
    }),
    to_record: Property.StaticDropdown({
      displayName: 'Record Meeting',
      description: 'Whether the Leexi assistant should record this meeting.',
      required: true,
      defaultValue: 'yes',
      options: yesNoOptions(),
    }),
    internal: Property.StaticDropdown({
      displayName: 'Internal Meeting',
      description: 'Whether the meeting is internal (no external customers).',
      required: true,
      defaultValue: 'no',
      options: yesNoOptions(),
    }),
    owned: Property.StaticDropdown({
      displayName: 'Owned by User',
      description: 'Whether the user is the owner of the meeting.',
      required: true,
      defaultValue: 'yes',
      options: yesNoOptions(),
    }),
    attendees: Property.Array({
      displayName: 'Attendee Emails',
      description: 'Email addresses of the attendees.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
        ],
      },
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const startTime = toIso({ value: p.start_time, label: 'start time' });
    const endTime = toIso({ value: p.end_time, label: 'end time' });
    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      throw new Error('End Time must be after Start Time.');
    }
    const attendees = (p.attendees ?? [])
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter((value) => value !== '');
    const body: Record<string, unknown> = {
      meeting_url: p.meeting_url.trim(),
      user_uuid: p.user_uuid.trim(),
      start_time: startTime,
      end_time: endTime,
      organizer: p.organizer.trim(),
      to_record: p.to_record === 'yes',
      internal: p.internal === 'yes',
      owned: p.owned === 'yes',
    };
    if (attendees.length > 0) {
      body['attendees'] = attendees;
    }
    if (p.title) {
      body['title'] = p.title;
    }
    if (p.description) {
      body['description'] = p.description;
    }
    if (p.direction) {
      body['direction'] = p.direction;
    }
    return await leexiApi.request<{ success: boolean; message: string; data: LeexiMeetingEvent }>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: ['meeting_events'],
      body,
    });
  },
});
