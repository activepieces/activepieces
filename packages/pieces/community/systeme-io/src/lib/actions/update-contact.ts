import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface SystemeIoContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  [key: string]: unknown;
}

export const updateContact = createAction({
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update a contact’s name, phone, or custom fields in systeme.io.',
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    customFields: Property.Object({ displayName: 'Custom Fields', required: false }),
  },
  async run(context) {
    const contactId = context.propsValue['contactId'];
    const firstName = context.propsValue['firstName'];
    const lastName = context.propsValue['lastName'];
    const phone = context.propsValue['phone'];
    const customFields = context.propsValue['customFields'];
    const body: Record<string, unknown> = {};
    if (firstName) body['firstName'] = firstName;
    if (lastName) body['lastName'] = lastName;
    if (phone) body['phone'] = phone;
    if (customFields) {
      if (typeof customFields !== 'object' || Array.isArray(customFields)) {
        throw new Error('Custom Fields must be an object.');
      }
      body['customFields'] = customFields;
    }
    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided to update.');
    }
    const response = await httpClient.sendRequest<SystemeIoContact>({
      method: HttpMethod.PATCH,
      url: `https://api.systeme.io/api/contacts/${contactId}`,
      headers: {
        'X-API-Key': String(context.auth),
        'Content-Type': 'application/merge-patch+json', // <-- Fix here
      },
      body,
    });
    return response.body;
  },
}); 