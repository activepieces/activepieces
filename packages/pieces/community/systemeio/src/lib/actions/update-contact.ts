import { createAction, Property } from '@activepieces/pieces-framework';
import { SystemeioApiClient } from '../api-client';
import { systemeioAuth } from '../auth';

export const updateContact = createAction({
  auth: systemeioAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update fields (name, phone, custom fields) of an existing contact.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
      description: 'The ID of the contact to update.'
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      required: false,
      description: 'Key-value pairs for custom fields.'
    })
  },
  async run({ auth, propsValue }) {
    const client = new SystemeioApiClient(auth);
    const data: any = {};
    if (propsValue.name) data.name = propsValue.name;
    if (propsValue.phone) data.phone = propsValue.phone;
    if (propsValue.customFields) data.customFields = propsValue.customFields;
    const response = await client.updateContact(propsValue.contactId, data);
    return response;
  },
}); 