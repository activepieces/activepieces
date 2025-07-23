import { createAction, Property, HttpMethod } from '@activepieces/pieces-framework';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';

export const systemeioUpdateContact = createAction({
  auth: systemeioAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update fields of an existing contact',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Update the contact’s name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Update the contact’s phone number',
      required: false,
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields as an array of {slug, value} objects',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, name, phone, customFields } = context.propsValue;
    const fields = customFields ? customFields.map((field: any) => ({
      slug: field.slug,
      value: field.value,
    })) : [];
    if (phone !== undefined) {
      fields.push({ slug: 'phone_number', value: phone });
    }
    const client = new SystemeioApiClient(context.auth as string);
    return await client.request({
      method: HttpMethod.PATCH,
      path: `/contacts/${contactId}`,
      contentType: 'application/merge-patch+json',
      body: {
        name,
        fields,
      },
    });
  },
}); 