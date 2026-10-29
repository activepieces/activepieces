import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event } from '../../../common/types';
import { outlookCalendarEventOutputSchema } from '../../../output-schemas';

export const outlookCalendarCreateEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_create_event',
  outputSchema: outlookCalendarEventOutputSchema,
  displayName: 'Create Event',
  description: 'Creates a calendar event, optionally with attendees.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Creates an event in the user's default calendar, or in one calendar when Calendar ID is set (from List Calendars). When attendees are given, Outlook sends each of them a meeting invitation immediately. Not idempotent: every call creates a new event, so check Get Calendar View before retrying.",
    idempotent: false,
  },
  props: {
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'Start',
      description:
        'Start as a local date-time without offset, e.g. "2026-11-01T09:00:00", read in Time Zone. For an all-day event use midnight.',
      required: true,
    }),
    end: Property.ShortText({
      displayName: 'End',
      description:
        'End as a local date-time without offset, e.g. "2026-11-01T10:00:00", read in Time Zone. For an all-day event use midnight of the following day.',
      required: true,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'Time zone of Start and End, IANA or Windows name, e.g. "Europe/London" or "Pacific Standard Time" (see Get Supported Time Zones). Defaults to UTC.',
      required: false,
    }),
    calendarId: outlookCalendarAiProps.calendarId({
      required: false,
      description: "Calendar ID, from List Calendars. Leave empty for the user's default calendar.",
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
        'People to invite; each one receives a meeting invitation when the event is created.',
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
        'Graph patternedRecurrence object, e.g. {"pattern":{"type":"weekly","interval":1,"daysOfWeek":["monday"]},"range":{"type":"endDate","startDate":"2026-11-02","endDate":"2026-12-28"}}. Leave empty for a single event.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const timeZone = p.timeZone || 'UTC';
    const categories = p.categories ?? [];
    const attendees = p.attendees ?? [];
    const response: Event = await outlookCalendarClient
      .create({ auth })
      .api(p.calendarId ? `/me/calendars/${encodeURIComponent(p.calendarId)}/events` : '/me/events')
      .post({
        subject: p.subject,
        start: { dateTime: p.start, timeZone },
        end: { dateTime: p.end, timeZone },
        ...(p.bodyContent !== undefined
          ? {
              body: {
                contentType: p.bodyContentType ?? 'text',
                content: p.bodyContent,
              },
            }
          : {}),
        ...(p.location !== undefined ? { location: { displayName: p.location } } : {}),
        ...(attendees.length > 0
          ? { attendees: outlookCalendarUtils.toAttendees({ items: attendees }) }
          : {}),
        ...(p.isAllDay !== undefined ? { isAllDay: p.isAllDay === 'true' } : {}),
        ...(p.isOnlineMeeting !== undefined
          ? { isOnlineMeeting: p.isOnlineMeeting === 'true' }
          : {}),
        ...(p.showAs !== undefined ? { showAs: p.showAs } : {}),
        ...(p.importance !== undefined ? { importance: p.importance } : {}),
        ...(p.sensitivity !== undefined ? { sensitivity: p.sensitivity } : {}),
        ...(categories.length > 0 ? { categories } : {}),
        ...(p.isReminderOn !== undefined ? { isReminderOn: p.isReminderOn === 'true' } : {}),
        ...(p.reminderMinutesBeforeStart !== undefined
          ? { reminderMinutesBeforeStart: p.reminderMinutesBeforeStart }
          : {}),
        ...(p.allowNewTimeProposals !== undefined
          ? { allowNewTimeProposals: p.allowNewTimeProposals === 'true' }
          : {}),
        ...(p.recurrence !== undefined ? { recurrence: p.recurrence } : {}),
      });
    return response;
  },
});
