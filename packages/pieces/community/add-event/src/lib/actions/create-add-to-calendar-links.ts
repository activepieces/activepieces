import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventEvent } from '../common/types';

export const addEventCreateAddToCalendarLinksAction = createAction({
  auth: addEventAuth,
  name: 'create_add_to_calendar_links',
  displayName: 'Create Dynamic Add to Calendar Links',
  description:
    'Creates an AddEvent event and returns its shareable "Add to Calendar" links. Opening a link lets recipients add the event to Apple, Google, Outlook, and other calendars. Each run produces a unique link, so links can be personalized per recipient.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates an AddEvent event and returns shareable "Add to Calendar" links that let recipients add it to Apple, Google, Outlook, and other calendars. Use when an agent needs distributable per-recipient calendar links rather than a managed calendar entry. Requires a title and start datetime; not idempotent, since each call creates a new event and a unique set of links.',
    idempotent: false,
  },
  props: {
    calendar_id: addEventProps.calendarId({ required: false }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The event title shown in the calendar.',
      required: true,
    }),
    datetime_start: Property.ShortText({
      displayName: 'Start Date/Time',
      description:
        "Format: 'YYYY-MM-DD HH:mm:ss' (24-hour), interpreted in the event's timezone. Example: 2025-06-15 14:30:00. A date alone (YYYY-MM-DD) is also accepted.",
      required: true,
    }),
    datetime_end: Property.ShortText({
      displayName: 'End Date/Time',
      description:
        'Same format as the start. Defaults to one hour after the start.',
      required: false,
    }),
    all_day_event: Property.Checkbox({
      displayName: 'All-day Event',
      required: false,
      defaultValue: false,
    }),
    timezone: addEventProps.timezone({ required: false }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Plain text or HTML (around 500 characters recommended).',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'A physical address or a URL.',
      required: false,
    }),
  },
  async run(context) {
    const event = await addEventApi.call<AddEventEvent>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/events',
      body: { ...context.propsValue },
    });
    return {
      id: event.id,
      title: event.title,
      link_long: event.link_long,
      link_short: event.link_short,
      datetime_start: event.datetime_start,
      datetime_end: event.datetime_end,
      timezone: event.timezone,
    };
  },
});
