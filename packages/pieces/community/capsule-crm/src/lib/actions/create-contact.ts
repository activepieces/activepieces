import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../../index';
import { capsuleCommon } from '../common';
import { capsuleProps } from '../common/props';

export const createContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new person or organisation in Capsule CRM',
  
  props: {
    type: capsuleProps.contactType,
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
      displayName: 'Organisation Name',
      description: 'Name of the organisation (required for organisation)',
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
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      description: 'Job title (for person)',
      required: false,
    }),
    about: Property.LongText({
      displayName: 'About',
      description: 'Additional information about the contact',
      required: false,
    }),
  },

  async run(context) {
    const { type, firstName, lastName, name, emailAddress, phoneNumber, jobTitle, about } = context.propsValue;

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
    } else {
      if (!name) {
        throw new Error('Organisation name is required for organisation contacts');
      }
      party.name = name;
    }

    if (about) party.about = about;

    // Add email address
    if (emailAddress) {
      party.emailAddresses = [{
        type: 'Work',
        address: emailAddress,
      }];
    }

    // Add phone number
    if (phoneNumber) {
      party.phoneNumbers = [{
        type: 'Work',
        number: phoneNumber,
      }];
    }

    const response = await capsuleCommon.makeRequest(
      context.auth,
      HttpMethod.POST,
      '/parties',
      { party }
    );

    return response.party;
  },
});
