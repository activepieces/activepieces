import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpResponse,
} from '@activepieces/pieces-common';
import { intercomClient } from '../common';
import { intercomAuth } from '../..';

enum ContactRole {
  USER = 'user',
  LEAD = 'lead',
}

export const getOrCreateContact = createAction({
  auth: intercomAuth,
  description: "Get or create a contact (ie. user or lead) if it isn't found",
  displayName: 'Get or Create Contact',
  name: 'get_or_create_contact',
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
    try {
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
    } catch (err: any) {
      if (err && err.body) {
        const errors = err.body['errors'];
        if (Array.isArray(errors) && errors[0] && errors[0].code === 'conflict') {
          const idFromErrorMessage = errors[0].message?.split('id=')[1];
          if (idFromErrorMessage) {
            return await client.contacts.find({ id: idFromErrorMessage });
          }
        }
      }
      throw err;
    }
  },
});
