import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { calcomAuth } from '../auth';
import { calcomCommon } from '../common';
import { deleteEventTypeActionOutputSchema } from '../output-schemas';

export const calcomDeleteEventType = createAction({
  auth: calcomAuth,
  name: 'calcom_delete_event_type',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Event Type',
  description: 'Permanently delete a Cal.com event type by id.',
  audience: 'ai',
  outputSchema: deleteEventTypeActionOutputSchema,
  aiMetadata: {
    description:
      'Permanently deletes an event type by id. Existing bookings for it are unaffected, but no new bookings can be made against it afterward. Not idempotent: a repeat call on the same id fails because it is already gone.',
    idempotent: false,
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
      method: HttpMethod.DELETE,
      path: `/event-types/${event_type_id}`,
      version: calcomCommon.versions.eventTypes,
    });
  },
});
