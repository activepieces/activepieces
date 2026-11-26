import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { krispcallAuth } from '../auth';

export const addContact = createAction({
  name: 'addContact',
  classification: 'WRITE',
  displayName: 'Add Contact',
  auth: krispcallAuth,
  description: 'Add a contact to your KrispCall account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a contact in the connected KrispCall account, keyed by phone number. Use when an agent needs to register a new contact (name, company, email, address are optional; only the contact number is required). Not idempotent — calling it again with the same number creates or re-submits another contact entry.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      placeholder: 'Jane Doe',
      required: false,
      width: 'half',
    }),
    number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'International format, with the country code.',
      placeholder: '+14155550123',
      required: true,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      placeholder: '221 Main St, Springfield',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      placeholder: 'Acme Inc.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
  },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['number', 'name', 'email'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Company and address',
      icon: 'location',
      props: ['company', 'address'],
    },
  ],
  async run({ auth, propsValue }) {
    const res = await httpClient.sendRequest<string[]>({
      method: HttpMethod.POST,
      url: 'https://app.krispcall.com/api/v3/platform/activepiece/add-contact',
      headers: {
        'X-API-KEY': auth.props.apiKey,
      },
      body: {
        name: propsValue.name,
        number: propsValue.number,
        company: propsValue.company,
        email: propsValue.email,
        address: propsValue.address,
      },
    });
    return res.body;
  },
});
