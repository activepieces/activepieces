import { weblingAuth } from '../../index';
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
  props: {
    eventIds: Property.ShortText({
      displayName: 'Event ID list',
      required: true,
      description:
        "Comma seperated list of event IDs (e.g. '536,525,506,535'). When at least one ID doesn't exist the whole query return a 404 error.",
    }),
    calendarId: Property.Dropdown<string>({
      displayName: 'Calendar',
      description: 'Calendar to filter the events by.',
      refreshers: [],
      required: false,
      options: async ({ auth }) => {
        const authProp = auth as PiecePropValueSchema<typeof weblingAuth>;
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
