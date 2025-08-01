import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const createContactAction = createAction({
  auth: missiveAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in a contact book',
  props: {
    contactBookId: Property.ShortText({
      displayName: 'Contact Book ID',
      description: 'The ID of the contact book to add the contact to',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Address',
      description: 'The address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The state',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'The ZIP code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The country',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the contact',
      required: false,
    }),
  },
  async run(context) {
    const { contactBookId, email, firstName, lastName, company, phone, address, city, state, zip, country, notes } = context.propsValue;
    const apiToken = context.auth.apiToken;

    const contactData = {
      contact_book_id: contactBookId,
      email,
      first_name: firstName,
      last_name: lastName,
      company,
      phone,
      address,
      city,
      state,
      zip,
      country,
      notes,
    };

    const response = await missiveApiCall(
      apiToken,
      '/contacts',
      HttpMethod.POST,
      { contact: contactData }
    );

    return response;
  },
}); 