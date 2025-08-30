import { Property, createAction } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const createContactAction = createAction({
  auth: wealthboxCrmAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in Wealthbox CRM',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    address: Property.Object({
      displayName: 'Address',
      required: false,
      properties: {
        street: Property.ShortText({
          displayName: 'Street',
          required: false,
        }),
        city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        state: Property.ShortText({
          displayName: 'State',
          required: false,
        }),
        zip: Property.ShortText({
          displayName: 'ZIP Code',
          required: false,
        }),
        country: Property.ShortText({
          displayName: 'Country',
          required: false,
        }),
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      required: false,
      items: Property.ShortText({
        displayName: 'Tag',
        required: true,
      }),
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
    contact_type: Property.StaticDropdown({
      displayName: 'Contact Type',
      required: false,
      options: {
        options: [
          { label: 'Person', value: 'Person' },
          { label: 'Company', value: 'Company' },
        ],
      },
    }),
  },
  async run(context) {
    const { first_name, last_name, email, phone, company, address, tags, notes, contact_type } = context.propsValue;
    
    const client = makeClient(context.auth);
    
    const contactData: any = {
      first_name,
      last_name,
      type: contact_type || 'Person',
    };

    if (email) contactData.email = email;
    if (phone) contactData.phone = phone;
    if (company) contactData.company = company;
    if (address) contactData.address = address;
    if (tags && tags.length > 0) contactData.tags = tags;
    if (notes) contactData.notes = notes;

    const result = await client.createContact(contactData);
    
    return result;
  },
});
