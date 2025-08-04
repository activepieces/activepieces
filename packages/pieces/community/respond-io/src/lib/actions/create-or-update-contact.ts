import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';
import { contactIdentifierDropdown } from '../common/props';

export const createOrUpdateContact = createAction({
  auth: respondIoAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description:
    'Creates a new contact or updates an existing one by ID, email, or phone.',
  props: {
    identifier: contactIdentifierDropdown,
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact (in E.164 format).',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code (e.g., "en", "es") following ISO 639-1.',
      required: false,
    }),
    profilePic: Property.ShortText({
      displayName: 'Profile Picture URL',
      description: "A direct URL to the contact's profile picture.",
      required: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description:
        'Country code (e.g., "US", "MY") following ISO 3166-1 alpha-2.',
      required: false,
    }),
    customFieldName: Property.ShortText({
      displayName: 'Custom Field Name',
      description: 'Name of the custom field (e.g., "Company Website", "Department").',
      required: false,
    }),
    customFieldValue: Property.ShortText({
      displayName: 'Custom Field Value',
      description: 'Value of the custom field. Format based on field type:\n- Text: "string"\n- Number: 123 (no quotes)\n- Email: "user@domain.com"\n- URL: "https://example.com"\n- Date: "yyyy-mm-dd"\n- Time: "HH:MM" (24H format)\n- Checkbox: "true" or "false"',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const { identifier, customFieldName, customFieldValue, ...contactData } = propsValue;

    // The API sends all data in the body
    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(contactData)) {
      if (value !== undefined && value !== null) {
        body[key] = value;
      }
    }

    if (customFieldName && customFieldValue !== undefined && customFieldValue !== null) {
      body['custom_fields'] = [
        {
          name: customFieldName,
          value: customFieldValue
        }
      ];
    }

    try {
      return await respondIoApiCall({
        method: HttpMethod.POST,
        url: `/contact/create_or_update/${identifier}`,
        auth: auth,
        body,
      });
    } catch (error: unknown) {
      const err = error as {
        response?: { status?: number; body?: { message?: string } };
      };
      const status = err.response?.status;
      const message =
        err.response?.body?.message || 'An unknown error occurred.';

      switch (status) {
        case 400:
          throw new Error(
            `Bad Request: The server could not process the request, please check the format of your input. Details: ${message}`
          );
        case 401:
        case 403:
          throw new Error(
            `Authentication Error: Please check your API Token. Details: ${message}`
          );
        case 409:
          throw new Error(
            `Conflict: The resource already exists or there is a conflict. Details: ${message}`
          );
        case 429:
          throw new Error(
            `Rate Limit Exceeded: Too many requests. Please wait and try again. Details: ${message}`
          );
        default:
          throw new Error(
            `Respond.io API Error (Status ${status || 'N/A'}): ${message}`
          );
      }
    }
  },
});
