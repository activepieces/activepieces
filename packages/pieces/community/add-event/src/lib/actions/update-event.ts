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
