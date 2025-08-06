import { createAction, Property } from '@activepieces/pieces-framework';
import { sellsyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: sellsyAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Sellsy',
  props: {
    civility: Property.StaticDropdown({
      displayName: 'Civility',
      description: 'Civility of contact',
      required: false,
      options: {
        options: [
          { label: 'Mr', value: 'mr' },
          { label: 'Mrs', value: 'mrs' },
          { label: 'Ms', value: 'ms' },
        ],
      },
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Contact website URL',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Contact phone number',
      required: false,
    }),
    mobile_number: Property.ShortText({
      displayName: 'Mobile Number',
      description: 'Contact mobile number',
      required: false,
    }),
    fax_number: Property.ShortText({
      displayName: 'Fax Number',
      description: 'Contact fax number',
      required: false,
    }),
    position: Property.ShortText({
      displayName: 'Position',
      description: 'Contact job position',
      required: false,
    }),
    birth_date: Property.ShortText({
      displayName: 'Birth Date',
      description: 'Contact birth date (YYYY-MM-DD format)',
      required: false,
    }),
    avatar: Property.ShortText({
      displayName: 'Avatar URL',
      description: 'Contact avatar image URL',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Note about the contact',
      required: false,
    }),
    owner_id: Property.Number({
      displayName: 'Owner ID',
      description: 'Owner of the contact (Staff ID)',
      required: false,
    }),
    marketing_campaigns_subscriptions: Property.StaticMultiSelectDropdown({
      displayName: 'Marketing Subscriptions',
      description: 'List of marketing campaign types subscribed',
      required: false,
      options: {
        options: [
          { label: 'SMS', value: 'sms' },
          { label: 'Phone', value: 'phone' },
          { label: 'Email', value: 'email' },
          { label: 'Postal Mail', value: 'postal_mail' },
          { label: 'Custom', value: 'custom' },
        ],
      },
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const contactData: any = {
      last_name: propsValue.last_name, // Required field
    };

    // Add optional fields if provided
    if (propsValue.civility) contactData.civility = propsValue.civility;
    if (propsValue.first_name) contactData.first_name = propsValue.first_name;
    if (propsValue.email) contactData.email = propsValue.email;
    if (propsValue.website) contactData.website = propsValue.website;
    if (propsValue.phone_number) contactData.phone_number = propsValue.phone_number;
    if (propsValue.mobile_number) contactData.mobile_number = propsValue.mobile_number;
    if (propsValue.fax_number) contactData.fax_number = propsValue.fax_number;
    if (propsValue.position) contactData.position = propsValue.position;
    if (propsValue.birth_date) contactData.birth_date = propsValue.birth_date;
    if (propsValue.avatar) contactData.avatar = propsValue.avatar;
    if (propsValue.note) contactData.note = propsValue.note;
    if (propsValue.owner_id) contactData.owner_id = propsValue.owner_id;
    if (propsValue.marketing_campaigns_subscriptions) {
      contactData.marketing_campaigns_subscriptions = propsValue.marketing_campaigns_subscriptions;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts',
      contactData
    );

    return response;
  },
});