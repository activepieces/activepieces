import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { makeClient } from '../common';

export const getCustomEvent = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_custom_event',
  displayName: 'Find Custom Event',
  description: 'Finds a custom event by name.',
  audience: 'both',
  aiMetadata: { description: 'Searches the custom event definitions in a Tarvent account, optionally filtered by name; leaving the name empty returns all custom events. Use to look up a custom event or its ID before generating it for a contact. Idempotent read-only lookup.', idempotent: true },
  props: {
    name: Property.ShortText({
      displayName: 'Custom event name',
      description: 'Find a custom event by searching using its name.',
      required: false,
      defaultValue: '',

    })
  },
  async run(context) {
    const { name } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.listCustomEventsAdv(name);
  },
});
