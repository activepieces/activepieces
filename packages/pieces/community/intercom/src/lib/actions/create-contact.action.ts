import { Property, createAction } from '@activepieces/pieces-framework';
import { intercomClient } from '../common';
import { intercomAuth } from '../..';

enum ContactRole {
  USER = 'user',
  LEAD = 'lead',
}

export const createContact = createAction({
  auth: intercomAuth,
  description: 'Create a contact (ie. user or lead)',
  displayName: 'Create Contact',
  name: 'create_contact',
  props: {
    role: Property.StaticDropdown({
      displayName: 'Role',
      required: true,
      options: {
        options: [
          { label: 'User', value: ContactRole.USER },
          { label: 'Lead', value: ContactRole.LEAD },
        ],
      },
      defaultValue: ContactRole.USER,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    external_id: Property.ShortText({
      displayName: 'External Id',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: 'Avatar Url',
      required: false,
      description: 'An image URL containing the avatar of a contact',
    }),
    custom_attributes: Property.Object({
      displayName: 'Custom Attributes',
      required: false,
    }),
  },
  run: async (context) => {
    const client = intercomClient(context.auth);
    if (context.propsValue.role === ContactRole.USER) {
      return await client.contacts.createUser({
        externalId: context.propsValue.external_id,
        email: context.propsValue.email,
        phone: context.propsValue.phone,
        name: context.propsValue.name,
        avatar: context.propsValue.avatar,
        signedUpAt: Date.now(),
        customAttributes: context.propsValue.custom_attributes,
      });
    } else {
      return await client.contacts.createLead({
        customAttributes: context.propsValue.custom_attributes,
        avatar: context.propsValue.avatar,
        signedUpAt: Date.now(),
        phone: context.propsValue.phone,
        name: context.propsValue.name,
        email: context.propsValue.email,
      });
    }
  },
});
