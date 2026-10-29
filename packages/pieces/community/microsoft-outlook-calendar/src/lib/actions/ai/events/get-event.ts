import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Event } from '../../../common/types';
import { outlookCalendarEventOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetEventAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_event',
  outputSchema: outlookCalendarEventOutputSchema,
  displayName: 'Get Event',
  description: 'Gets one calendar event by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one event in the signed-in user's mailbox by its ID (from List Events, Get Calendar View or Create Event), with subject, start, end, attendees, location, body and recurrence. Event IDs are mailbox-wide, so no calendar ID is needed.",
    idempotent: true,
  },
  props: {
    eventId: outlookCalendarAiProps.eventId({ required: true }),
    select: Property.ShortText({
      displayName: 'Select',
      description:
        'Comma-separated event properties to return, e.g. "subject,start,end,attendees". Leave empty for all properties.',
      required: false,
    }),
    timeZone: outlookCalendarAiProps.timeZone({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response: Event = await outlookCalendarClient
      .create({ auth })
      .api(`/me/events/${encodeURIComponent(propsValue.eventId)}`)
      .query(propsValue.select ? { $select: propsValue.select } : {})
      .headers(
        outlookCalendarUtils.preferTimeZone({
          timeZone: propsValue.timeZone,
        }),
      )
      .get();
    return response;
  },
});
