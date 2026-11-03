import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieDeleteCalendarEventAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_delete_calendar_event',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Calendar Event',
  description: 'Delete a Moxie calendar event.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes a Moxie calendar event by its id. Use to remove an event that was cancelled elsewhere. Not idempotent: a second call for the same id fails with a not-found error.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.deletedCalendarEvent,
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      description: 'Id of the event, from Create or Update Calendar Event.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = moxieInput.id({ value: propsValue.eventId, field: 'Event ID' });
    await moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.DELETE,
      path: `/action/calendar/${encodeURIComponent(id)}`,
      notFoundMessage: `No calendar event with id ${id} in this Moxie workspace (it may already be deleted).`,
    });
    return { id, deleted: true };
  },
});
