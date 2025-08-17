import { createAction, Property } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { contactIdDropdown } from '../common/props';

export const createContact = createAction({
  auth: OpenPhoneAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in OpenPhone',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "The contact's last name",
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: "The contact's company name",
      required: false,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      description: "The contact's role or title",
      required: false,
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description:
        'Array of phone number objects with name and value properties (value in E.164 format)',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: 'The phone number\'s name Examples: "work", "mobile"',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description:
            'The phone number\'s value (E.164 format) Examples: "+1234567890"',
          required: true,
        }),
      },
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Array of email objects with name and value properties',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Name',
          description: 'The email address\'s name Examples: "company email"',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description:
            'The email address\'s value Examples: "company@example.com"',
          required: true,
        }),
      },
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description:
        'Array of custom field objects with key and value properties',
      required: false,
    }),

    source: Property.StaticDropdown({
      displayName: 'Source',
      description:
        "The contact's source (1-72 characters). Cannot be reserved words: openphone, device, csv, zapier, google-people, other",
      required: false,
      defaultValue: 'public-api',
      options: {
        options: [
          { label: 'Public API', value: 'public-api' },
          { label: 'OpenPhone', value: 'openphone' },
          { label: 'Device', value: 'device' },
          { label: 'CSV', value: 'csv' },
          { label: 'Zapier', value: 'zapier' },
          { label: 'Google People', value: 'google-people' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    sourceUrl: Property.ShortText({
      displayName: 'Source URL',
      description:
        'A link to the contact in the source system (1-200 characters)',
      required: false,
    }),
    externalId: contactIdDropdown,
  },
  async run({ auth, propsValue }) {
    const {
      firstName,
      lastName,
      company,
      role,
      phoneNumbers,
      emails,
      customFields,
      source,
      sourceUrl,
      externalId,
    } = propsValue;

    if (sourceUrl && (sourceUrl.length < 1 || sourceUrl.length > 200)) {
      throw new Error('Source URL must be between 1 and 200 characters');
    }

    const requestBody: any = {};

    const defaultFields: any = {};
    if (firstName) defaultFields.firstName = firstName;
    if (lastName) defaultFields.lastName = lastName;
    if (company) defaultFields.company = company;
    if (role) defaultFields.role = role;
    if (phoneNumbers && phoneNumbers.length > 0)
      defaultFields.phoneNumbers = phoneNumbers;
    if (emails && emails.length > 0) defaultFields.emails = emails;

    if (Object.keys(defaultFields).length > 0) {
      requestBody.defaultFields = defaultFields;
    }

    if (customFields && customFields.length > 0) {
      requestBody.customFields = customFields;
    }

    if (source) requestBody.source = source;
    if (sourceUrl) requestBody.sourceUrl = sourceUrl;
    if (externalId) requestBody.externalId = externalId;

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/contacts',
      requestBody
    );

    return response;
  },
});
