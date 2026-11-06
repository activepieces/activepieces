import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Calendar } from '../../../common/types';
import { outlookCalendarCalendarOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetEventCalendarAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_event_calendar',
  outputSchema: outlookCalendarCalendarOutputSchema,
  displayName: 'Get Event Calendar',
  description: 'Gets the calendar that contains an event.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the calendar that holds an event, given the event ID from List Events, Get Calendar View or Create Event. Use it to find which calendar an event lives in, e.g. before deciding whether it is on a shared calendar.',
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const client = outlookCalendarClient.create({ auth });
    const eventPath = `/me/events/${encodeURIComponent(propsValue.eventId)}`;
    await client.api(eventPath).query({ $select: 'id' }).get();
    const response: Calendar = await client.api(`${eventPath}/calendar`).get();
    return response;
  },
});
