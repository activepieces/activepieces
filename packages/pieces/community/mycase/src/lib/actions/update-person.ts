import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const updatePersonAction = createAction({
  auth: mycaseAuth,
  name: 'update_person',
  displayName: 'Update Person',
  description: 'Updates an existing person',
  props: {
    person_id: Property.ShortText({ displayName: 'Person ID', required: true }),
    first_name: Property.ShortText({ displayName: 'First Name', required: false }),
    last_name: Property.ShortText({ displayName: 'Last Name', required: false }),
  },
  async run(context) {
    const client = new MyCaseClient(context.auth as OAuth2PropertyValue);
    const data: Record<string, unknown> = {};
    if (context.propsValue.first_name) data.first_name = context.propsValue.first_name;
    if (context.propsValue.last_name) data.last_name = context.propsValue.last_name;
    return await client.updatePerson(context.propsValue.person_id, data);
  },
});

