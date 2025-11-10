import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createTimeEntryAction = createAction({
  auth: mycaseAuth,
  name: 'create_time_entry',
  displayName: 'Create Time Entry',
  description: 'Creates a new time entry',
  props: {
    description: Property.ShortText({ displayName: 'Description', required: true }),
    hours: Property.Number({ displayName: 'Hours', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createTimeEntry({ 
      description: context.propsValue.description,
      hours: context.propsValue.hours 
    });
  },
});

