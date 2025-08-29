import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const createContact = createAction({
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street Address',
      description: 'The street address of the contact',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'The city of the contact',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      description: 'The state of the contact',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'The ZIP code of the contact',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'The country of the contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to assign to the contact',
      required: false,
    }),
    household_id: Property.ShortText({
      displayName: 'Household ID',
      description: 'The ID of the household to assign the contact to',
      required: false,
    }),
  },
  async run(context) {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    
    const contactData: any = {
      first_name: context.propsValue.first_name,
      last_name: context.propsValue.last_name,
    };

    if (context.propsValue.email) {
      contactData.email = context.propsValue.email;
    }

    if (context.propsValue.phone) {
      contactData.phone = context.propsValue.phone;
    }

    if (context.propsValue.street || context.propsValue.city || context.propsValue.state || context.propsValue.zip || context.propsValue.country) {
      contactData.address = {};
      if (context.propsValue.street) contactData.address.street = context.propsValue.street;
      if (context.propsValue.city) contactData.address.city = context.propsValue.city;
      if (context.propsValue.state) contactData.address.state = context.propsValue.state;
      if (context.propsValue.zip) contactData.address.zip = context.propsValue.zip;
      if (context.propsValue.country) contactData.address.country = context.propsValue.country;
    }

    if (context.propsValue.tags && context.propsValue.tags.length > 0) {
      contactData.tags = context.propsValue.tags;
    }

    if (context.propsValue.household_id) {
      contactData.household_id = context.propsValue.household_id;
    }

    const contact = await client.createContact(contactData);
    return contact;
  },
}); 