import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAContact = createAction({
  auth: aircallAuth,
  name: 'createAContact',
  displayName: 'Create a Contact',
  description:'Creates a new contact.',
  props: {
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      required: true,
      properties: {
        label: Property.ShortText({
          displayName: 'Label',
          description: 'Label for the phone number (e.g., Work, Mobile, Home).',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Phone number with country code (e.g., +19001112222).',
          required: true,
        }),
      },
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    information: Property.LongText({
      displayName: 'Information',
      description: 'Additional information about the contact.',
      required: false,
    }),

    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Array of email addresses (optional, max 20)',
      required: false,
      properties: {
        label: Property.ShortText({
          displayName: 'Label',
          description: 'Label for the email (e.g., Office, Personal)',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Email Address',
          description: 'Email address',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const {
      first_name,
      last_name,
      company_name,
      information,
      phone_numbers,
      emails,
    } = context.propsValue;

    // Prepare request body
    const requestBody: Record<string,any> = {
      phone_numbers,
    };

    if (first_name) requestBody['first_name'] = first_name;
    if (last_name) requestBody['last_name'] = last_name;
    if (company_name) requestBody['company_name'] = company_name;
    if (information) requestBody['information'] = information;

    if (emails && emails.length > 0) {
      requestBody['emails'] = emails;
    }

    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      '/contacts',
      requestBody
    );

    return response;
  },
});
