import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import {
  openPhoneCommon,
  OpenPhoneContactResponse,
  CreateOpenPhoneContactRequest,
  OpenPhoneEmail,
  OpenPhonePhoneNumber,
  OpenPhoneCustomField,
} from '../common';

export const createContact = createAction({
  auth: openPhoneAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in your OpenPhone workspace',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "The contact's first name",
      required: true,
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
      description: "The contact's role",
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'List of email addresses for the contact',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Email Label',
          description:
            'Label for this email address (e.g., "work", "personal")',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Email Address',
          description: 'The email address',
          required: true,
        }),
      },
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'List of phone numbers for the contact',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Phone Label',
          description: 'Label for this phone number (e.g., "mobile", "work")',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Phone Number',
          description: 'The phone number (preferably in E.164 format)',
          required: true,
        }),
      },
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Custom fields for the contact',
      required: false,
      properties: {
        key: Property.ShortText({
          displayName: 'Field Key',
          description: 'The identifying key for the custom field',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          description: 'The value for the custom field',
          required: true,
        }),
      },
    }),
    createdByUserId: Property.ShortText({
      displayName: 'Created By User ID',
      description:
        'The unique identifier of the user who created the contact (US123abc format)',
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'The contact\'s source (defaults to "public-api")',
      required: false,
      defaultValue: 'public-api',
    }),
    sourceUrl: Property.ShortText({
      displayName: 'Source URL',
      description: 'A link to the contact in the source system',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier from an external system',
      required: false,
    }),
  },
  async run(context) {
    const {
      firstName,
      lastName,
      company,
      role,
      emails,
      phoneNumbers,
      customFields,
      createdByUserId,
      source,
      sourceUrl,
      externalId,
    } = context.propsValue;
    const auth = context.auth;

    if (!firstName || firstName.trim() === '') {
      throw new Error('First name is required and cannot be empty');
    }

    if (emails && Array.isArray(emails)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emails as Array<{ name: string; value: string }>) {
        if (email.value && !emailRegex.test(email.value)) {
          throw new Error(`Invalid email format: ${email.value}`);
        }
      }
    }

    if (source && (source.length < 1 || source.length > 72)) {
      throw new Error('Source must be between 1 and 72 characters');
    }

    if (sourceUrl) {
      try {
        new URL(sourceUrl);
      } catch {
        throw new Error('Invalid source URL format');
      }
      if (sourceUrl.length < 1 || sourceUrl.length > 200) {
        throw new Error('Source URL must be between 1 and 200 characters');
      }
    }

    if (externalId && (externalId.length < 1 || externalId.length > 75)) {
      throw new Error('External ID must be between 1 and 75 characters');
    }

    if (createdByUserId && !/^US(.*)$/.test(createdByUserId)) {
      throw new Error(
        'Created by user ID must start with "US" (e.g., US123abc)'
      );
    }

    const requestBody: CreateOpenPhoneContactRequest = {
      defaultFields: {
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : null,
        company: company ? company.trim() : null,
        role: role ? role.trim() : null,
      },
    };

    if (emails && Array.isArray(emails) && emails.length > 0) {
      requestBody.defaultFields.emails = (
        emails as Array<{ name: string; value: string }>
      ).map(
        (email): OpenPhoneEmail => ({
          name: email.name.trim(),
          value: email.value ? email.value.trim() : null,
        })
      );
    }

    if (
      phoneNumbers &&
      Array.isArray(phoneNumbers) &&
      phoneNumbers.length > 0
    ) {
      requestBody.defaultFields.phoneNumbers = (
        phoneNumbers as Array<{ name: string; value: string }>
      ).map(
        (phone): OpenPhonePhoneNumber => ({
          name: phone.name.trim(),
          value: phone.value ? phone.value.trim() : null,
        })
      );
    }

    if (
      customFields &&
      Array.isArray(customFields) &&
      customFields.length > 0
    ) {
      requestBody.customFields = (
        customFields as Array<{ key: string; value: string }>
      ).map(
        (field): OpenPhoneCustomField => ({
          key: field.key.trim(),
          value: field.value ? field.value.trim() : null,
        })
      );
    }

    if (createdByUserId) {
      requestBody.createdByUserId = createdByUserId.trim();
    }

    if (source) {
      requestBody.source = source.trim();
    }

    if (sourceUrl) {
      requestBody.sourceUrl = sourceUrl.trim();
    }

    if (externalId) {
      requestBody.externalId = externalId.trim();
    }

    try {
      const response: OpenPhoneContactResponse =
        await openPhoneCommon.makeRequest<OpenPhoneContactResponse>(
          HttpMethod.POST,
          '/v1/contacts',
          auth,
          requestBody
        );

      return response;
    } catch (error) {
      throw new Error(`Failed to create contact: ${error}`);
    }
  },
});
