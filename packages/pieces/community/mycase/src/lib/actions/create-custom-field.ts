import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createCustomFieldAction = createAction({
  auth: mycaseAuth,
  name: 'create_custom_field',
  displayName: 'Create Custom Field',
  description: 'Creates a new custom field',
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    field_type: Property.ShortText({ displayName: 'Field Type', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    return await client.createCustomField({ 
      name: context.propsValue.name,
      field_type: context.propsValue.field_type 
    });
  },
});

