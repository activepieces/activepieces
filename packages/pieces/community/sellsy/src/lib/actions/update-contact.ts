import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const updateContact = createAction({
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact in Sellsy',
  auth: sellsyAuth,
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone number',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Contact company name',
      required: false,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'Contact position/title',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the contact',
      required: false,
    }),
  },
  async run(context) {
    const { access_token } = context.auth as { access_token: string };

    const contactData: any = {};
    if (context.propsValue.firstName) contactData.first_name = context.propsValue.firstName;
    if (context.propsValue.lastName) contactData.last_name = context.propsValue.lastName;
    if (context.propsValue.email) contactData.email = context.propsValue.email;
    if (context.propsValue.phone) contactData.phone = context.propsValue.phone;
    if (context.propsValue.company) contactData.company = context.propsValue.company;
    if (context.propsValue.position) contactData.position = context.propsValue.position;
    if (context.propsValue.notes) contactData.note = context.propsValue.notes;

    const response = await makeRequest(
      { access_token },
      HttpMethod.PUT,
      `/people/${context.propsValue.contactId}`,
      contactData
    );
    return response;
  },
}); 