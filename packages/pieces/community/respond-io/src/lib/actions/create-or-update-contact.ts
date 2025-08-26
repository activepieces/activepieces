import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoApiCall } from '../common/client';
import { respondIoAuth } from '../common/auth';

export const createOrUpdateContact = createAction({
  auth: respondIoAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Create a new contact or update an existing one by email, phone, or ID.',
  props: {
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description:
        'Identifier for the contact. Use format: `id:123`, `email:user@example.com`, or `phone:+60123456789`. If contact exists, it will be updated; if not, a new one will be created.',
      required: true,
    }),
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
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Add custom fields for the contact.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Field Name',
          description: 'Name of the custom field (e.g., "Company Website", "Department").',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          description: 'Value of the custom field. Format based on field type:\n- Text: "string" (use quotation marks)\n- Number: 123 (without quotation marks)\n- Email: "user@domain.com"\n- URL: "https://example.com"\n- Date: "yyyy-mm-dd"\n- Time: "HH:MM" (24H format)\n- Checkbox: "true" or "false"',
          required: false,
        }),
      },
    }),
  },
  async run({ propsValue, auth }) {
    const { identifier, customFields, ...contactData } = propsValue;

    // Field validation
    if (contactData.email && contactData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactData.email)) {
        throw new Error('Invalid email format. Please provide a valid email address.');
      }
    }

    if (contactData.phone && contactData.phone.trim()) {
      const e164Regex = /^\+[1-9]\d{1,14}$/;
      if (!e164Regex.test(contactData.phone)) {
        throw new Error('Invalid phone format. Please provide phone number in E.164 format (e.g., +60123456789).');
      }
    }

    if (contactData.profilePic && contactData.profilePic.trim()) {
      const urlRegex = /^https?:\/\/[^\s$.?#].[^\s]*$/;
      if (!urlRegex.test(contactData.profilePic)) {
        throw new Error('Invalid profile picture URL format. Please provide a valid HTTP/HTTPS URL.');
      }
    }

    if (contactData.language && contactData.language.trim()) {
      const iso639Regex = /^[a-z]{2}$/;
      if (!iso639Regex.test(contactData.language)) {
        throw new Error('Invalid language code. Please provide a valid ISO 639-1 two-letter language code (e.g., "en", "es").');
      }
    }

    if (contactData.countryCode && contactData.countryCode.trim()) {
      const iso3166Regex = /^[A-Z]{2}$/;
      if (!iso3166Regex.test(contactData.countryCode)) {
        throw new Error('Invalid country code. Please provide a valid ISO 3166-1 alpha-2 two-letter country code (e.g., "US", "MY").');
      }
    }

    const body: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(contactData)) {
      if (value !== undefined && value !== null) {
        body[key] = value;
      }
    }

    // Add custom fields array if provided
    if (customFields && Array.isArray(customFields) && customFields.length > 0) {
      body['custom_fields'] = customFields
        .filter((field: any) => field.name && field.name.trim())
        .map((field: any) => ({
          name: field.name,
          value: field.value || null,
        }));
    }

    return await respondIoApiCall({
      method: HttpMethod.POST,
      url: `/contact/create_or_update/${identifier}`,
      auth: auth,
      body,
    });
  },
});
