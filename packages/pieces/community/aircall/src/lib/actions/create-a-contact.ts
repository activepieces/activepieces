import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createAContact = createAction({
  auth: aircallAuth,
  name: 'createAContact',
  displayName: 'Create a Contact',
  description: 'Create a new contact in Aircall that will be shared across the company',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact (max 255 characters)',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact (max 255 characters)',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name of the contact (max 255 characters)',
      required: false,
    }),
    information: Property.LongText({
      displayName: 'Information',
      description: 'Additional information about the contact',
      required: false,
    }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Array of phone numbers (required, max 20)',
      required: true,
      properties: {
        label: Property.ShortText({
          displayName: 'Label',
          description: 'Label for the phone number (e.g., Work, Mobile, Home)',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Phone number with country code (e.g., +19001112222)',
          required: true,
        }),
      },
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
    const { first_name, last_name, company_name, information, phone_numbers, emails } = context.propsValue;
    const accessToken = context.auth.access_token;

    // Prepare request body
    const requestBody: any = {
      phone_numbers: phone_numbers.map((phone: any) => ({
        label: phone.label,
        value: phone.value,
      })),
    };

    // Add optional fields if provided
    if (first_name) requestBody.first_name = first_name;
    if (last_name) requestBody.last_name = last_name;
    if (company_name) requestBody.company_name = company_name;
    if (information) requestBody.information = information;
    
    if (emails && emails.length > 0) {
      requestBody.emails = emails.map((email: any) => ({
        label: email.label,
        value: email.value,
      }));
    }

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/contacts',
      requestBody
    );

    return response;
  },
});