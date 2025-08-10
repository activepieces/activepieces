import { createAction, Property } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateContact = createAction({
  auth: OpenPhoneAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in OpenPhone',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact to update',
      required: true,
    }),
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
    externalId: Property.ShortText({
      displayName: 'External ID',
      description:
        'A unique identifier from an external system (1-75 characters)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      contactId,
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

    if (externalId && (externalId.length < 1 || externalId.length > 75)) {
      throw new Error('External ID must be between 1 and 75 characters');
    }

    const requestBody: any = {};

    const defaultFields: any = {};
    if (firstName !== undefined) defaultFields.firstName = firstName;
    if (lastName !== undefined) defaultFields.lastName = lastName;
    if (company !== undefined) defaultFields.company = company;
    if (role !== undefined) defaultFields.role = role;
    if (phoneNumbers !== undefined) defaultFields.phoneNumbers = phoneNumbers;
    if (emails !== undefined) defaultFields.emails = emails;

    if (Object.keys(defaultFields).length > 0) {
      requestBody.defaultFields = defaultFields;
    }

    if (customFields !== undefined) {
      requestBody.customFields = customFields;
    }

    if (source !== undefined) requestBody.source = source;
    if (sourceUrl !== undefined) requestBody.sourceUrl = sourceUrl;
    if (externalId !== undefined) requestBody.externalId = externalId;

    const response = await makeRequest(
      auth,
      HttpMethod.PATCH,
      `/contacts/${contactId}`,
      requestBody
    );

    return response;
  },
});
