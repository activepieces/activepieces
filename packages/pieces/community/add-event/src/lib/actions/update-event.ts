import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventEvent } from '../common/types';

export const addEventUpdateEventAction = createAction({
  auth: addEventAuth,
  name: 'update_event',
  displayName: 'Update Event',
  description:
    'Updates an event on your AddEvent calendar. Only the fields you fill in are changed.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing AddEvent event identified by its event ID, applying a partial change where only the fields you provide are modified. Use when an agent needs to edit details of an event that already exists. Requires a valid event ID; idempotent, since reapplying the same field values to the same event leaves it in the same state.',
    idempotent: true,
  },
  props: {
    event_id: addEventProps.eventId({ required: true }),
    ...addEventProps.eventFields({ mode: 'update' }),
  },
  async run(context) {
    const { event_id, ...body } = context.propsValue;
    const event = await addEventApi.call<AddEventEvent>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PATCH,
      resourceUri: `/events/${event_id}`,
      body,
    });
    return event;
  },
});
