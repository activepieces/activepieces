import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { mycaseAuth } from '../..';
import { MyCaseClient } from '../common';

export const createPersonAction = createAction({
  auth: mycaseAuth,
  name: 'create_person',
  displayName: 'Create Person',
  description: 'Creates a new person contact in MyCase',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Address',
      required: false,
    }),
  },
  async run(context) {
    const client = new MyCaseClient(
      context.auth as OAuth2PropertyValue
    );

    const data = {
      first_name: context.propsValue.first_name,
      last_name: context.propsValue.last_name,
      email: context.propsValue.email,
      phone: context.propsValue.phone,
      address: context.propsValue.address,
    };

    return await client.createPerson(data);
  },
});

