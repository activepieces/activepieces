import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';

export const addEventDeleteEventAction = createAction({
  auth: addEventAuth,
  name: 'delete_event',
  displayName: 'Delete Event',
  description: 'Deletes an event on your AddEvent calendar.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes an AddEvent event identified by its event ID. Use when an agent needs to remove an event entirely. Requires a valid event ID; idempotent, since once the event is deleted, repeating the call leaves it absent.',
    idempotent: true,
  },
  props: {
    event_id: addEventProps.eventId({ required: true }),
  },
  async run(context) {
    const { event_id } = context.propsValue;
    await addEventApi.call({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      resourceUri: `/events/${event_id}`,
    });
    return { success: true, id: event_id };
  },
});
