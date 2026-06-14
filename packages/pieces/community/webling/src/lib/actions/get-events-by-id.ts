import { weblingAuth } from '../auth';
import { createAction, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { getCalendars, getEventsById } from '../common/helpers';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const eventsById = createAction({
  auth: weblingAuth,
  name: 'EventsById',
  displayName: 'Get Events by ID',
  description:
    'Gets event data by a list of event IDs and optional calendar ID to filter.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches Webling calendar events by their IDs, optionally narrowing the result to a single calendar. Use it when you already have event IDs and need their full details. Pass IDs as a comma-separated string (e.g. "536,525,506"); if any ID does not exist the entire request fails with a 404. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    eventIds: Property.ShortText({
      displayName: 'Event ID list',
      required: true,
      description:
        "Comma separated list of event IDs (e.g. '536,525,506,535'). When at least one ID doesn't exist the whole query return a 404 error.",
    }),
    calendarId: Property.Dropdown<string,false,typeof weblingAuth>({
      auth: weblingAuth,
      displayName: 'Calendar',
      description: 'Calendar to filter the events by.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'connect your account first',
            options: [],
          };
        }
        const authProp = auth;
        const calendars = await getCalendars(authProp);
        return {
          disabled: false,
          options: calendars.map((calendar) => {
            return {
              label: calendar.properties.title,
              value: calendar.id,
            };
          }),
        };
      },
    }),
  },
  async run(configValue) {
    const { eventIds: eventIds, calendarId: calendarId } =
      configValue.propsValue;

    await propsValidation.validateZod(configValue.propsValue, {
      eventIds: z.string().regex(/^\d+(,\d+)*$/),
    });

    const events = await getEventsById(configValue.auth, eventIds);
    if (calendarId) {
      return events.filter((event) => event.parents.includes(calendarId));
    }
    return events;
  },
});
