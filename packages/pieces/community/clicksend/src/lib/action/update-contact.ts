import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
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
  classification: 'WRITE',
  description: 'Updates an existing contact in a contact list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates the details of an existing ClickSend contact, identified by its contact id within a given contact list, applying only the fields you supply (phone, email, name, company, address). Choose this to edit a known contact rather than create one. Idempotent: re-sending the same values leaves the contact in the same state.',
    idempotent: true,
  },
  displayName: 'Update Contact',
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Contact to update',
      icon: 'users',
      props: ['contact_list_id', 'contact_id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'user',
      props: [
        'info',
        'phone_number',
        'email',
        'first_name',
        'last_name',
        'company_name',
      ],
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
    contact_id: clicksendCommon.contact_id,
    info: Property.MarkDown({
      value: 'Only the fields you fill in are sent to ClickSend.',
      variant: MarkdownVariant.INFO,
    }),
    phone_number: Property.ShortText({
      description: 'International format, with the country code.',
      placeholder: '+14155550123',
      displayName: 'Phone Number',
      required: false,
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
      ...(company_name && { organization_name: company_name }),
      ...(address_line_1 && { address_line_1 }),
      ...(address_line_2 && { address_line_2 }),
      ...(city && { address_city: city }),
      ...(state && { address_state: state }),
      ...(postal_code && { address_postal_code: postal_code }),
      ...(country && { address_country: country }),
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
