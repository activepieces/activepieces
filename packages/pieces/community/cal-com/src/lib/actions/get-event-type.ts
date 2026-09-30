import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { eventTypeActionOutputSchema } from '../output-schemas';

export const calcomGetEventType = createAction({
  auth: calcomAuth,
  name: 'calcom_get_event_type',
  classification: 'READ',
  displayName: 'Get Event Type',
  description: 'Get the full configuration of a single Cal.com event type by id.',
  audience: 'ai',
  outputSchema: eventTypeActionOutputSchema,
  aiMetadata: {
    description:
      'Retrieves full details for one event type by id, including duration, booking window and location settings. Get the id from List Event Types. Does not include the event type\'s bookings.',
    idempotent: true,
  },
  props: {
    event_type_id: Property.Number({
      displayName: 'Event Type ID',
      description: 'Get this from List Event Types.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    const { event_type_id } = propsValue;

    return await calcomCommon.calRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: `/event-types/${event_type_id}`,
      version: calcomCommon.versions.eventTypes,
    });
  },
});
