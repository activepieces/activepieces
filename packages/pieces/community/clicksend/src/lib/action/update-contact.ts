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

export const clicksendUpdateContactAction = createAction({
  auth: clicksendAuth,
  name: 'update_contact',
  description: 'Updates an existing contact in a contact list.',
  displayName: 'Update Contact',
  props: {
    contact_list_id: clicksendCommon.contact_list_id,
    contact_id: clicksendCommon.contact_id,
    phone_number: Property.ShortText({
      description: 'The phone number of the contact',
      displayName: 'Phone Number',
      required: false,
    }),
    email: Property.ShortText({
      description: 'The email address of the contact',
      displayName: 'Email Address',
      required: false,
    }),
    first_name: Property.ShortText({
      description: 'The first name of the contact',
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      description: 'The last name of the contact',
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      description: 'The company name of the contact',
      displayName: 'Company Name',
      required: false,
    }),
    address_line_1: Property.ShortText({
      description: 'The first line of the address',
      displayName: 'Address Line 1',
      required: false,
    }),
    address_line_2: Property.ShortText({
      description: 'The second line of the address',
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      description: 'The city of the contact',
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      description: 'The state/province of the contact',
      displayName: 'State/Province',
      required: false,
    }),
    postal_code: Property.ShortText({
      description: 'The postal code of the contact',
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      description: 'The country of the contact',
      displayName: 'Country',
      required: false,
    }),
  },
  async run(context) {
    const {
      contact_id,
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
      contact_list_id,
      country,
    } = context.propsValue;
    if (phone_number && !isValidPhone(phone_number)) {
      throw new Error('Invalid phone number.');
    }
    if (email && !isValidEmail(email)) {
      throw new Error('Invalid email address.');
    }
    const username = context.auth.username;
    const password = context.auth.password;
    const contactData = {
      ...(phone_number && { phone_number }),
      ...(email && { email }),
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(company_name && { company_name }),
      ...(address_line_1 && { address_line_1 }),
      ...(address_line_2 && { address_line_2 }),
      ...(city && { city }),
      ...(state && { state }),
      ...(postal_code && { postal_code }),
      ...(country && { country }),
    };
    try {
      const response= await callClickSendApi({
        method: HttpMethod.PUT,
        path: `/lists/${contact_list_id}/contacts/${contact_id}`,
        username,
        password,
        body: contactData,
      });

      return response.body;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        throw new Error('Contact not found.');
      }
      if (error?.response?.status === 403) {
        throw new Error('Permission denied.');
      }
      throw error;
    }
  },
});
