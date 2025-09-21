import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const createContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact (person or organization) in Capsule CRM.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Type of contact to create',
      required: true,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Organization', value: 'organisation' },
        ],
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name (required for person)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name (required for person)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Organization name (required for organization)',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title (for person only)',
      required: false,
    }),
    about: Property.LongText({
      displayName: 'About',
      description: 'About description',
      required: false,
    }),
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'Primary email address',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Primary phone number',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'Website URL',
      required: false,
    }),
    address: Property.ShortText({
      displayName: 'Address',
      description: 'Street address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Province',
      description: 'State or province',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'ZIP or postal code',
      required: false,
    }),
  },
  async run(context) {
    const { type, firstName, lastName, name, jobTitle, about, emailAddress, phoneNumber, website, address, city, state, country, zip } = context.propsValue;

    // Build the party object based on type
    const party: any = {
      type: type,
    };

    if (type === 'person') {
      if (!firstName || !lastName) {
        throw new Error('First name and last name are required for person contacts');
      }
      party.firstName = firstName;
      party.lastName = lastName;
      if (jobTitle) party.jobTitle = jobTitle;
    } else if (type === 'organisation') {
      if (!name) {
        throw new Error('Organization name is required for organization contacts');
      }
      party.name = name;
    }

    if (about) party.about = about;

    // Add contact details
    const contacts: any[] = [];

    if (emailAddress) {
      contacts.push({
        type: 'email',
        address: emailAddress,
      });
    }

    if (phoneNumber) {
      contacts.push({
        type: 'phone',
        number: phoneNumber,
      });
    }

    if (website) {
      contacts.push({
        type: 'website',
        webAddress: website,
        service: 'URL',
      });
    }

    if (contacts.length > 0) {
      if (emailAddress) party.emailAddresses = [{ address: emailAddress }];
      if (phoneNumber) party.phoneNumbers = [{ number: phoneNumber }];
      if (website) party.websites = [{ webAddress: website, service: 'URL' }];
    }

    // Add address if provided
    if (address || city || state || country || zip) {
      party.addresses = [{
        type: 'postal',
        street: address || '',
        city: city || '',
        state: state || '',
        country: country || '',
        zip: zip || '',
      }];
    }

    const requestBody = { party };

    const response = await makeApiCall(
      context.auth,
      API_ENDPOINTS.PARTIES,
      'POST',
      requestBody
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to create contact: ${response.status} ${response.body?.message || ''}`);
    }
  },
});