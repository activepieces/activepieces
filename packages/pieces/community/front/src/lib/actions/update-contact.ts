import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactDropdown } from '../common/props';

export const updateContact = createAction({
  auth: frontAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Modify existing contact fields.',
  props: {
    contact_id: contactDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The new name for the contact.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The new description for the contact.',
      required: false,
    }),
    links: Property.Array({
      displayName: 'Links',
      description: 'A list of URLs to associate with the contact. This will overwrite existing links.',
      required: false,
    }),
    list_names: Property.Array({
        displayName: 'Contact Lists',
        description: 'A list of contact list names. This will overwrite the existing lists.',
        required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom fields to update. Note: This will replace all existing custom fields.',
      required: false,
    }),
  },
  async run(context) {
    const { contact_id, ...body } = context.propsValue;
    const token = context.auth;

    Object.keys(body).forEach(key => {
        const prop = body[key as keyof typeof body];
        if (prop === undefined || (Array.isArray(prop) && prop.length === 0)) {
            delete body[key as keyof typeof body];
        }
    });


    await makeRequest(
        token,
        HttpMethod.PATCH,
        `/contacts/${contact_id}`,
        body
    );

    return { success: true };
  },
});