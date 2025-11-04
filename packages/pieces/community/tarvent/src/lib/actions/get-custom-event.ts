import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../..';
import { makeClient } from '../common';

export const getCustomEvent = createAction({
  auth: tarventAuth,
  name: 'tarvent_get_custom_event',
  displayName: 'Find Custom Event',
  description: 'Finds a custom event by name.',
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
