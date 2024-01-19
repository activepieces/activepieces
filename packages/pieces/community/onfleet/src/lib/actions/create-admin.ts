import { Property, createAction } from '@activepieces/pieces-framework';
import { onfleetAuth } from '../..';
import { common } from '../common';

import Onfleet from '@onfleet/node-onfleet';

export const createAdmin = createAction({
  auth: onfleetAuth,
  name: 'create_admin',
  displayName: 'Create Administrator',
  description: 'Create a new administrator',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Full name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    isReadOnly: Property.Checkbox({
      displayName: 'Read Only',
      description: 'Whether this administrator can perform write operations.',
      required: false,
    }),
  },
  async run(context) {
    const onfleetApi = new Onfleet(context.auth);

    return await onfleetApi.administrators.create({
      name: context.propsValue.name,
      email: context.propsValue.email,
      phone: context.propsValue.phone,
      isReadOnly: context.propsValue.isReadOnly,
    });
  },
});
