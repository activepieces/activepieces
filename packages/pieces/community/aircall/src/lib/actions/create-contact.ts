import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { aircallAuth } from '../common/auth';
import { makeClient } from '../common/client';

export const createContactAction = createAction({
  auth: aircallAuth,
  name: 'create_contact',
  displayName: 'Create a Contact',
  description: 'Add a new contact within Aircall',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The contact\'s first name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The contact\'s last name',
      required: true,
    }),
    companyName: Property.ShortText({
      displayName: 'Company Name',
      description: 'The contact\'s company name',
      required: false,
    }),
    information: Property.LongText({
      displayName: 'Information',
      description: 'Additional information about the contact',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description: 'List of email addresses',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
      },
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'List of phone numbers',
      required: false,
      properties: {
        phoneNumber: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    // Validate inputs
    if (!context.propsValue.firstName || context.propsValue.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!context.propsValue.lastName || context.propsValue.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (context.propsValue.firstName.length > 50) {
      throw new Error('First name cannot exceed 50 characters');
    }

    if (context.propsValue.lastName.length > 50) {
      throw new Error('Last name cannot exceed 50 characters');
    }

    if (context.propsValue.companyName && context.propsValue.companyName.length > 100) {
      throw new Error('Company name cannot exceed 100 characters');
    }

    if (context.propsValue.information && context.propsValue.information.length > 500) {
      throw new Error('Information cannot exceed 500 characters');
    }

    // Validate emails if provided
    if (context.propsValue.emails && context.propsValue.emails.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const emailItem of context.propsValue.emails) {
        const email = emailItem as { email: string };
        if (!emailRegex.test(email.email)) {
          throw new Error(`Invalid email format: ${email.email}`);
        }
      }
    }

    // Validate phone numbers if provided
    if (context.propsValue.phoneNumbers && context.propsValue.phoneNumbers.length > 0) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      for (const phoneItem of context.propsValue.phoneNumbers) {
        const phone = phoneItem as { phoneNumber: string };
        if (!phoneRegex.test(phone.phoneNumber.replace(/\s/g, ''))) {
          throw new Error(`Invalid phone number format: ${phone.phoneNumber}`);
        }
      }
    }

    const client = makeClient({
      username: context.auth.username,
      password: context.auth.password,
      baseUrl: context.auth.baseUrl || 'https://api.aircall.io/v1',
    });

    const body: Record<string, unknown> = {
      first_name: context.propsValue.firstName.trim(),
      last_name: context.propsValue.lastName.trim(),
    };

    if (context.propsValue.companyName) {
      body['company_name'] = context.propsValue.companyName.trim();
    }

    if (context.propsValue.information) {
      body['information'] = context.propsValue.information.trim();
    }

    if (context.propsValue.emails && context.propsValue.emails.length > 0) {
      body['emails'] = context.propsValue.emails.map((item) => (item as { email: string }).email.trim());
    }

    if (context.propsValue.phoneNumbers && context.propsValue.phoneNumbers.length > 0) {
      body['phone_numbers'] = context.propsValue.phoneNumbers.map((item) => (item as { phoneNumber: string }).phoneNumber.trim());
    }

    try {
      const response = await client.makeRequest({
        method: HttpMethod.POST,
        url: '/contacts',
        body,
      });

      return response;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response: { status: number } }).response;
        if (response.status === 400) {
          throw new Error('Invalid request. Please check your input parameters.');
        }
        if (response.status === 409) {
          throw new Error('Contact already exists with the provided information.');
        }
      }
      throw new Error(`Failed to create contact: ${errorMessage}`);
    }
  },
}); 