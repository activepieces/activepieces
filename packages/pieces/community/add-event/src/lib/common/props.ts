import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from './client';
import {
  AddEventCalendar,
  AddEventPage,
  AddEventSubscriber,
  AddEventTimezone,
} from './types';

const calendarId = ({ required = true }: { required?: boolean } = {}) =>
  Property.Dropdown({
    displayName: 'Calendar',
    description: 'The calendar to use.',
    auth: addEventAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your AddEvent account first.',
        };
      }
      try {
        const calendars = await addEventApi.getAllPages<AddEventCalendar>({
          apiKey: auth.secret_text,
          resourceUri: '/calendars',
          select: (page) => page.calendars ?? [],
        });
        if (calendars.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No calendars found in your AddEvent account.',
          };
        }
        return {
          disabled: false,
          options: calendars.map((calendar) => ({
            label: calendar.is_default_calendar
              ? `${calendar.title} (Default)`
              : calendar.title,
            value: calendar.id,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load calendars. Check your connection.',
        };
      }
    },
  });

const eventId = ({ required = true }: { required?: boolean } = {}) =>
  Property.Dropdown({
    displayName: 'Event',
    description: 'Start typing to search your events by title.',
    auth: addEventAuth,
    required,
    refreshers: [],
    options: async ({ auth, searchValue }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your AddEvent account first.',
        };
      }
      try {
        const search = typeof searchValue === 'string' ? searchValue : undefined;
        const response = await addEventApi.call<AddEventPage>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/events',
          query: {
            search,
            page_size: addEventApi.maxPageSize,
            sort_by: 'datetime_start',
            sort_order: 'desc',
          },
        });
        const events = response.events ?? [];
        if (events.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No events found.',
          };
        }
        return {
          disabled: false,
          options: events.map((event) => ({
            label: `${event.title} (${event.datetime_start})`,
            value: event.id,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load events. Check your connection.',
        };
      }
    },
  });

const subscriberId = ({ required = true }: { required?: boolean } = {}) =>
  Property.Dropdown({
    displayName: 'Subscriber',
    description: 'Pick a calendar above to narrow this list.',
    auth: addEventAuth,
    required,
    refreshers: ['calendar_id'],
    options: async ({ auth, calendar_id }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your AddEvent account first.',
        };
      }
      try {
        const calId = typeof calendar_id === 'string' ? calendar_id : undefined;
        const subscribers = await addEventApi.getAllPages<AddEventSubscriber>({
          apiKey: auth.secret_text,
          resourceUri: '/subscribers',
          select: (page) => page.subscribers ?? [],
          query: calId ? { calendar_ids: [calId] } : undefined,
          maxPages: 10,
        });
        if (subscribers.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No subscribers found.',
          };
        }
        return {
          disabled: false,
          options: subscribers.map((subscriber) => {
            const data = subscriber.subscriber_form_data ?? {};
            const emailValue = data['email'];
            const nameValue = data['name'];
            const label =
              (typeof emailValue === 'string' && emailValue) ||
              (typeof nameValue === 'string' && nameValue) ||
              subscriber.id;
            return {
              label: `${label} (${subscriber.calendar_type})`,
              value: subscriber.id,
            };
          }),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load subscribers. Check your connection.',
        };
      }
    },
  });

const timezone = ({ required = false }: { required?: boolean } = {}) =>
  Property.Dropdown({
    displayName: 'Timezone',
    description:
      "The event's timezone. Defaults to the calendar's timezone if left blank.",
    auth: addEventAuth,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your AddEvent account first.',
        };
      }
      try {
        const timezones = await addEventApi.call<AddEventTimezone[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          resourceUri: '/timezones',
        });
        return {
          disabled: false,
          options: timezones.map((tz) => ({
            label: `${tz.name} (UTC${tz.utc_offset_hours})`,
            value: tz.name,
          })),
        };
      } catch (e) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load timezones. Check your connection.',
        };
      }
    },
  });

const eventFields = ({ mode }: { mode: 'create' | 'update' }) => {
  const isCreate = mode === 'create';
  return {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The event title.',
      required: isCreate,
    }),
    calendar_id: calendarId({ required: false }),
    datetime_start: Property.ShortText({
      displayName: 'Start Date/Time',
      description:
        "Format: 'YYYY-MM-DD HH:mm:ss' (24-hour), interpreted in the event's timezone. Example: 2025-06-15 14:30:00. A date alone (YYYY-MM-DD) is also accepted.",
      required: isCreate,
    }),
    datetime_end: Property.ShortText({
      displayName: 'End Date/Time',
      description:
        'Same format as the start. Defaults to one hour after the start.',
      required: false,
    }),
    all_day_event: isCreate
      ? Property.Checkbox({
          displayName: 'All-day Event',
          required: false,
          defaultValue: false,
        })
      : Property.StaticDropdown({
          displayName: 'All-day Event',
          description: 'Leave blank to keep the current value.',
          required: false,
          options: {
            options: [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
          },
        }),
    timezone: timezone({ required: false }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Plain text or HTML (around 500 characters recommended).',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'A physical address or a URL. Leave blank if you set a saved Location ID instead.',
      required: false,
    }),
    location_id: Property.Number({
      displayName: 'Saved Location ID',
      description:
        'The ID of a saved location in AddEvent. Use this instead of Location.',
      required: false,
    }),
    organizer_name: Property.ShortText({
      displayName: 'Organizer Name',
      description: 'Required if you set an organizer email.',
      required: false,
    }),
    organizer_email: Property.ShortText({
      displayName: 'Organizer Email',
      description: 'Required if you set an organizer name.',
      required: false,
    }),
    reminder: Property.Number({
      displayName: 'Reminder (minutes before)',
      description: 'Minutes before the event to remind attendees (0–10800).',
      required: false,
      defaultValue: isCreate ? 30 : undefined,
    }),
    color: Property.Number({
      displayName: 'Color',
      description: 'Color from the calendar palette (1–20).',
      required: false,
      defaultValue: isCreate ? 1 : undefined,
    }),
    free_busy: Property.StaticDropdown({
      displayName: 'Show As',
      description: "How the event appears in attendees' calendars.",
      required: false,
      defaultValue: isCreate ? 'default' : undefined,
      options: {
        options: [
          { label: 'Default', value: 'default' },
          { label: 'Busy', value: 'busy' },
          { label: 'Free', value: 'free' },
        ],
      },
    }),
    recurring_rule: Property.ShortText({
      displayName: 'Recurrence Rule',
      description:
        'An iCalendar RRULE, e.g. FREQ=WEEKLY;BYDAY=MO. Leave blank for a one-time event.',
      required: false,
    }),
    internal_name: Property.ShortText({
      displayName: 'Internal Name',
      description: 'A private label for your reference; not shown to attendees.',
      required: false,
    }),
    landing_page_template_id: Property.ShortText({
      displayName: 'Landing Page Template ID',
      description: "A custom landing page template ID, or 'default'.",
      required: false,
    }),
    rsvp_enabled: isCreate
      ? Property.Checkbox({
          displayName: 'Enable RSVP',
          required: false,
          defaultValue: false,
        })
      : Property.StaticDropdown({
          displayName: 'Enable RSVP',
          description: 'Leave blank to keep the current value.',
          required: false,
          options: {
            options: [
              { label: 'Yes', value: true },
              { label: 'No', value: false },
            ],
          },
        }),
    rsvp_form_id: Property.ShortText({
      displayName: 'RSVP Form ID',
      description:
        "A custom RSVP form ID, or 'default'. Only used when RSVP is enabled.",
      required: false,
    }),
    custom_data: Property.Object({
      displayName: 'Custom Data',
      description: 'Arbitrary key-value pairs (use snake_case keys).',
      required: false,
    }),
  };
};

export const addEventProps = {
  calendarId,
  eventId,
  subscriberId,
  timezone,
  eventFields,
};
