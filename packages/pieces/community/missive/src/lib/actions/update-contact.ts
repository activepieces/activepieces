import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const updateContactAction = createAction({
  auth: missiveAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact by ID',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
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
    const { contactId, email, firstName, lastName, company, phone, address, city, state, zip, country, notes } = context.propsValue;
    const apiToken = context.auth.apiToken;

    const contactData: Record<string, unknown> = {};
    if (email) contactData.email = email;
    if (firstName) contactData.first_name = firstName;
    if (lastName) contactData.last_name = lastName;
    if (company) contactData.company = company;
    if (phone) contactData.phone = phone;
    if (address) contactData.address = address;
    if (city) contactData.city = city;
    if (state) contactData.state = state;
    if (zip) contactData.zip = zip;
    if (country) contactData.country = country;
    if (notes) contactData.notes = notes;

    const response = await missiveApiCall(
      apiToken,
      `/contacts/${contactId}`,
      HttpMethod.PUT,
      { contact: contactData }
    );

    return response;
  },
}); 