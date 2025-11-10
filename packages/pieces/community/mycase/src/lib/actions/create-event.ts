import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createEventAction = createAction({
  auth: mycaseAuth,
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Creates a new event',
  props: {
    title: Property.ShortText({ displayName: 'Title', required: true }),
    start_time: Property.ShortText({ displayName: 'Start Time', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createEvent({ 
      title: context.propsValue.title,
      start_time: context.propsValue.start_time 
    });
  },
});

