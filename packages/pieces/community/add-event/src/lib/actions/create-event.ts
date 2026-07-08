import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { addEventAuth } from '../auth';
import { addEventApi } from '../common/client';
import { addEventProps } from '../common/props';
import { AddEventEvent } from '../common/types';

export const addEventCreateEventAction = createAction({
  auth: addEventAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a new event on your AddEvent calendar.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new event on an AddEvent calendar from the supplied title, schedule, and details. Use when an agent needs to add a brand-new calendar event. Not idempotent: each call creates a separate event, so repeating it produces duplicates; to avoid that, use Find or Create Event instead.',
    idempotent: false,
  },
  props: {
    ...addEventProps.eventFields({ mode: 'create' }),
  },
  async run(context) {
    const event = await addEventApi.call<AddEventEvent>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/events',
      body: { ...context.propsValue },
    });
    return event;
  },
});
