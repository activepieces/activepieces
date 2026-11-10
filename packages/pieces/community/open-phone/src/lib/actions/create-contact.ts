import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../auth';
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
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Create a new contact in your OpenPhone workspace',
  audience: 'both',
  aiMetadata: { description: 'Creates a new contact in the OpenPhone workspace with optional emails, phone numbers, company, role, and custom fields. Choose this when adding a brand-new person; use Update Contact to modify an existing one. First name is required. Not idempotent — each call creates a separate contact even with identical input.', idempotent: false },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['firstName', 'lastName', 'company', 'role'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Emails and Phones',
      icon: 'inbox',
      props: ['emails', 'phoneNumbers'],
    },
  ],
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      width: 'half',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      width: 'half',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      placeholder: 'Acme Inc.',
      width: 'half',
      required: false,
    }),
    role: Property.ShortText({
      displayName: 'Role',
      placeholder: 'Sales Manager',
      width: 'half',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Each email needs a label, such as work or personal.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Email Label',
          placeholder: 'work',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Email Address',
          placeholder: 'jane@example.com',
          required: true,
        }),
      },
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Each number needs a label, such as mobile or work.',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Phone Label',
          placeholder: 'mobile',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Include the country code.',
          placeholder: '+15555555555',
          required: true,
        }),
      },
    }),
    customFields: Property.Array({
      displayName: 'Custom Fields',
      description: 'Values for custom fields set up in OpenPhone.',
      required: false,
      properties: {
        key: Property.ShortText({
          displayName: 'Field Key',
          description: "The custom field's key in OpenPhone.",
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Field Value',
          required: true,
        }),
      },
    }),
    createdByUserId: Property.ShortText({
      displayName: 'Created By User ID',
      description: 'OpenPhone user shown as the creator.',
      placeholder: 'US123abc',
      advanced: true,
      required: false,
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where the contact came from. Defaults to public-api.',
      advanced: true,
      required: false,
      defaultValue: 'public-api',
    }),
    sourceUrl: Property.ShortText({
      displayName: 'Source URL',
      description: 'A link to the contact in the system it came from.',
      placeholder: 'https://crm.example.com/contacts/123',
      advanced: true,
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: "The contact's ID in another system, up to 75 characters.",
      advanced: true,
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
