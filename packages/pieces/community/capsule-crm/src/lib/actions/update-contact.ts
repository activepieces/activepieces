import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common';
import { makeApiCall, API_ENDPOINTS } from '../common';

export const updateContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact (person or organization) in Capsule CRM.',
  props: {
    partyId: Property.Number({
      displayName: 'Contact ID',
      description: 'ID of the contact to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'First name (for person)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name (for person)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Organization Name',
      description: 'Organization name (for organization)',
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
    const { partyId, firstName, lastName, name, jobTitle, about, emailAddress, phoneNumber, website, address, city, state, country, zip } = context.propsValue;

    // Build the party object with only provided fields
    const party: any = {};

    if (firstName) party.firstName = firstName;
    if (lastName) party.lastName = lastName;
    if (name) party.name = name;
    if (jobTitle) party.jobTitle = jobTitle;
    if (about) party.about = about;

    // Add contact details if provided
    if (emailAddress) {
      party.emailAddresses = [{ address: emailAddress }];
    }

    if (phoneNumber) {
      party.phoneNumbers = [{ number: phoneNumber }];
    }

    if (website) {
      party.websites = [{ webAddress: website, service: 'URL' }];
    }

    // Add address if any address field is provided
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
      `${API_ENDPOINTS.PARTIES}/${partyId}`,
      'PUT',
      requestBody
    );

    if (response.status >= 200 && response.status < 300) {
      return response.body;
    } else {
      throw new Error(`Failed to update contact: ${response.status} ${response.body?.message || ''}`);
    }
  },
});