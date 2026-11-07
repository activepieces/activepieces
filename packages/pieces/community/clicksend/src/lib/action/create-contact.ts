import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callClickSendApi, clicksendCommon } from '../common';
import { clicksendAuth } from '../..';

function isValidPhone(phone: string) {
  return /^\+?[1-9]\d{1,14}$/.test(phone);
}
function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export const clicksendCreateContactAction = createAction({
  auth: clicksendAuth,
  name: 'create_contact',
  classification: 'WRITE',
  description: 'Creates a new contact in a contact list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a new contact (phone number plus optional email, name, company, and address fields) to a specific ClickSend contact list identified by its list id. Choose this to populate a list before messaging. Requires a valid phone number; not idempotent, as repeating the call attempts to create another contact and the API rejects duplicates.',
    idempotent: false,
  },
  displayName: 'Create Contact',
  propertyGroups: [
    {
      key: 'list',
      display: 'section',
      label: 'Add to',
      icon: 'inbox',
      props: ['contact_list_id'],
    },
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['phone_number', 'email', 'first_name', 'last_name', 'company_name'],
    },
    {
      key: 'address',
      display: 'section',
      label: 'Address',
      icon: 'location',
      props: [
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'postal_code',
        'country',
      ],
    },
  ],
  props: {
    contact_list_id: clicksendCommon.contact_list_id,
    phone_number: Property.ShortText({
      description: 'International format, with the country code.',
      placeholder: '+14155550123',
      displayName: 'Phone Number',
      required: true,
    }),
    email: Property.ShortText({
      placeholder: 'jane@example.com',
      displayName: 'Email Address',
      required: false,
    }),
    first_name: Property.ShortText({
      width: 'half',
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      width: 'half',
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    address_line_1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    address_line_2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      width: 'half',
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      width: 'half',
      displayName: 'State/Province',
      required: false,
    }),
    postal_code: Property.ShortText({
      width: 'half',
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      width: 'half',
      displayName: 'Country',
      required: false,
    }),
  },
  async run(context) {
    const {
      contact_list_id,
      phone_number,
      email,
      first_name,
      last_name,
      company_name,
      address_line_1,
      address_line_2,
      city,
      state,
      postal_code,
      country,
    } = context.propsValue;
    if (!phone_number || !isValidPhone(phone_number)) {
      throw new Error('A valid phone number is required.');
    }
    if (email && !isValidEmail(email)) {
      throw new Error('Invalid email address.');
    }
    const username = context.auth.username;
    const password = context.auth.password;
    const contactData = {
      phone_number,
      ...(email && { email }),
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(company_name && { organization_name: company_name }),
      ...(address_line_1 && { address_line_1 }),
      ...(address_line_2 && { address_line_2 }),
      ...(city && { address_city: city }),
      ...(state && { address_state: state }),
      ...(postal_code && { address_postal_code: postal_code }),
      ...(country && { address_country: country }),
    };
    try {
      const response =  await callClickSendApi({
        method: HttpMethod.POST,
        path: `/lists/${contact_list_id}/contacts`,
        username,
        password,
        body: contactData,
      });
      return response.body;
    } catch (error: any) {
      if (error?.response?.body?.response_code === 'ALREADY_EXISTS') {
        throw new Error('Contact already exists in this list.');
      }
      throw error;
    }
  },
});
