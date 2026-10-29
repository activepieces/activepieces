import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event } from '../../../common/types';
import { outlookCalendarEventOutputSchema } from '../../../output-schemas';

const CLEARABLE_FIELDS = [
  { label: 'Body', value: 'body' },
  { label: 'Location', value: 'location' },
  { label: 'Attendees', value: 'attendees' },
  { label: 'Categories', value: 'categories' },
  { label: 'Recurrence', value: 'recurrence' },
];

export const outlookCalendarUpdateEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_update_event',
  outputSchema: outlookCalendarEventOutputSchema,
  displayName: 'Update Event',
  description: 'Updates the fields you set on a calendar event.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields that are set on an event, by its ID from List Events, Get Calendar View or Create Event; use Clear Fields to empty body, location, attendees, categories or recurrence. Attendees replaces the whole list, and when the signed-in user organizes the meeting, attendees receive an updated invitation. Updating a series master changes every occurrence.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: false,
    }),
    start: Property.ShortText({
      displayName: 'Start',
      description:
        'Start as a local date-time without offset, e.g. "2026-11-01T09:00:00", read in Time Zone. For an all-day event use midnight.',
      required: false,
    }),
    end: Property.ShortText({
      displayName: 'End',
      description:
        'End as a local date-time without offset, e.g. "2026-11-01T10:00:00", read in Time Zone. For an all-day event use midnight of the following day.',
      required: false,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'Time zone of Start and End, used only when one of them is set; IANA or Windows name, e.g. "Europe/London" or "Pacific Standard Time" (see Get Supported Time Zones). Defaults to UTC.',
      required: false,
    }),
    bodyContent: Property.LongText({
      displayName: 'Body',
      description: 'Event description.',
      required: false,
    }),
    bodyContentType: Property.StaticDropdown({
      displayName: 'Body Type',
      description: 'Format of Body. Defaults to text.',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().bodyType },
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Location display name, e.g. a room or address.',
      required: false,
    }),
    attendees: Property.Array({
      displayName: 'Attendees',
      description:
        'Replaces the whole attendee list; added attendees get an invitation, removed ones a cancellation. Use Clear Fields to remove all attendees.',
      required: false,
      properties: {
        email: Property.ShortText({ displayName: 'Email', required: true }),
        name: Property.ShortText({ displayName: 'Name', required: false }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'Defaults to required.',
          required: false,
          options: { options: outlookCalendarUtils.eventOptions().attendeeType },
        }),
      },
    }),
    isAllDay: Property.StaticDropdown({
      displayName: 'All Day',
      description:
        'Whether the event lasts whole days. Start and End must then be midnight in Time Zone.',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().boolean },
    }),
    isOnlineMeeting: Property.StaticDropdown({
      displayName: 'Online Meeting',
      description:
        "Whether to add an online meeting link using the mailbox's default provider, e.g. Teams.",
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().boolean },
    }),
    showAs: Property.StaticDropdown({
      displayName: 'Show As',
      description: 'Free/busy status shown for the event. Defaults to busy.',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().showAs },
    }),
    importance: Property.StaticDropdown({
      displayName: 'Importance',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().importance },
    }),
    sensitivity: Property.StaticDropdown({
      displayName: 'Sensitivity',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().sensitivity },
    }),
    categories: Property.Array({
      displayName: 'Categories',
      description: 'Category names, e.g. "Red category".',
      required: false,
    }),
    isReminderOn: Property.StaticDropdown({
      displayName: 'Reminder On',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().boolean },
    }),
    reminderMinutesBeforeStart: Property.Number({
      displayName: 'Reminder Minutes Before Start',
      required: false,
    }),
    allowNewTimeProposals: Property.StaticDropdown({
      displayName: 'Allow New Time Proposals',
      description: 'Whether attendees may propose another time. Defaults to true.',
      required: false,
      options: { options: outlookCalendarUtils.eventOptions().boolean },
    }),
    recurrence: Property.Json({
      displayName: 'Recurrence',
      description:
        'Graph patternedRecurrence object, e.g. {"pattern":{"type":"weekly","interval":1,"daysOfWeek":["monday"]},"range":{"type":"endDate","startDate":"2026-11-02","endDate":"2026-12-28"}}. Use Clear Fields to stop the recurrence.',
      required: false,
    }),
    clearFields: Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description: 'Fields to empty. A field listed here cannot also be given a value.',
      required: false,
      options: { options: CLEARABLE_FIELDS },
    }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const clear = p.clearFields ?? [];
    const categories = p.categories ?? [];
    const attendees = p.attendees ?? [];
    const given: Record<string, boolean> = {
      body: p.bodyContent !== undefined,
      location: p.location !== undefined,
      attendees: attendees.length > 0,
      categories: categories.length > 0,
      recurrence: p.recurrence !== undefined,
    };
    const conflicts = clear.filter((field) => given[field]);
    if (conflicts.length > 0) {
      throw new Error(`Clear Fields and a value were both given for: ${conflicts.join(', ')}.`);
    }
    if (p.timeZone && p.start === undefined && p.end === undefined) {
      throw new Error('Time Zone only applies together with Start or End.');
    }
    const timeZone = p.timeZone || 'UTC';
    const body = {
      ...(p.subject !== undefined ? { subject: p.subject } : {}),
      ...(p.start !== undefined ? { start: { dateTime: p.start, timeZone } } : {}),
      ...(p.end !== undefined ? { end: { dateTime: p.end, timeZone } } : {}),
      ...(p.bodyContent !== undefined
        ? {
            body: {
              contentType: p.bodyContentType ?? 'text',
              content: p.bodyContent,
            },
          }
        : {}),
      ...(clear.includes('body') ? { body: { contentType: 'text', content: '' } } : {}),
      ...(p.location !== undefined ? { location: { displayName: p.location } } : {}),
      ...(clear.includes('location') ? { location: { displayName: '' } } : {}),
      ...(attendees.length > 0
        ? { attendees: outlookCalendarUtils.toAttendees({ items: attendees }) }
        : {}),
      ...(clear.includes('attendees') ? { attendees: [] } : {}),
      ...(p.isAllDay !== undefined ? { isAllDay: p.isAllDay === 'true' } : {}),
      ...(p.isOnlineMeeting !== undefined ? { isOnlineMeeting: p.isOnlineMeeting === 'true' } : {}),
      ...(p.showAs !== undefined ? { showAs: p.showAs } : {}),
      ...(p.importance !== undefined ? { importance: p.importance } : {}),
      ...(p.sensitivity !== undefined ? { sensitivity: p.sensitivity } : {}),
      ...(categories.length > 0 ? { categories } : {}),
      ...(clear.includes('categories') ? { categories: [] } : {}),
      ...(p.isReminderOn !== undefined ? { isReminderOn: p.isReminderOn === 'true' } : {}),
      ...(p.reminderMinutesBeforeStart !== undefined
        ? { reminderMinutesBeforeStart: p.reminderMinutesBeforeStart }
        : {}),
      ...(p.allowNewTimeProposals !== undefined
        ? { allowNewTimeProposals: p.allowNewTimeProposals === 'true' }
        : {}),
      ...(p.recurrence !== undefined ? { recurrence: p.recurrence } : {}),
      ...(clear.includes('recurrence') ? { recurrence: null } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one field to update or to clear.');
    }
    const response: Event = await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(p.eventId)}`)
      .patch(body);
    return response;
  },
});
