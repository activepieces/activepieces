import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import {
  openPhoneCommon,
  OpenPhoneContactResponse,
  UpdateOpenPhoneContactRequest,
  OpenPhoneEmail,
  OpenPhonePhoneNumber,
} from '../common';
import { contactDropdown } from '../common/props';

export const updateContact = createAction({
  auth: openPhoneAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in your OpenPhone workspace',
  props: {
    contactId: contactDropdown,
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
      description: "The contact's role",
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description:
        'List of email addresses for the contact (replaces existing emails)',
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
          description: 'The email address (set to empty to remove)',
          required: false,
        }),
        id: Property.ShortText({
          displayName: 'Email ID',
          description:
            'The unique identifier for existing email field (required for updates)',
          required: false,
        }),
      },
    }),
    phoneNumbers: Property.Array({
      displayName: 'Phone Numbers',
      description:
        'List of phone numbers for the contact (replaces existing phone numbers)',
      required: false,
      properties: {
        name: Property.ShortText({
          displayName: 'Phone Label',
          description: 'Label for this phone number (e.g., "mobile", "work")',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Phone Number',
          description:
            'The phone number (set to empty to remove, preferably in E.164 format)',
          required: false,
        }),
        id: Property.ShortText({
          displayName: 'Phone ID',
          description:
            'The unique identifier for existing phone number field (required for updates)',
          required: false,
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
          description:
            'The value for the custom field (set to empty to remove)',
          required: false,
        }),
        id: Property.ShortText({
          displayName: 'Field ID',
          description:
            'The unique identifier for the custom field (required for updates)',
          required: false,
        }),
      },
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: "Update the contact's source",
      required: false,
    }),
    sourceUrl: Property.ShortText({
      displayName: 'Source URL',
      description: 'Update the link to the contact in the source system',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description: 'Update the unique identifier from an external system',
      required: false,
    }),
  },
  async run(context) {
    const {
      contactId,
      firstName,
      lastName,
      company,
      role,
      emails,
      phoneNumbers,
      customFields,
      source,
      sourceUrl,
      externalId,
    } = context.propsValue;
    const auth = context.auth;

    if (!contactId) {
      throw new Error('Contact ID is required');
    }

    if (emails && Array.isArray(emails)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of emails as Array<{
        name: string;
        value?: string;
        id?: string;
      }>) {
        if (
          email.value &&
          email.value.trim() &&
          !emailRegex.test(email.value)
        ) {
          throw new Error(`Invalid email format: ${email.value}`);
        }
      }
    }

    if (source && (source.length < 1 || source.length > 72)) {
      throw new Error('Source must be between 1 and 72 characters');
    }

    if (sourceUrl) {
      if (sourceUrl.trim()) {
        try {
          new URL(sourceUrl);
        } catch {
          throw new Error('Invalid source URL format');
        }
        if (sourceUrl.length < 1 || sourceUrl.length > 200) {
          throw new Error('Source URL must be between 1 and 200 characters');
        }
      }
    }

    if (
      externalId &&
      externalId.trim() &&
      (externalId.length < 1 || externalId.length > 75)
    ) {
      throw new Error('External ID must be between 1 and 75 characters');
    }

    const requestBody: UpdateOpenPhoneContactRequest = {};

    const hasDefaultFields =
      firstName || lastName || company || role || emails || phoneNumbers;
    if (hasDefaultFields) {
      requestBody.defaultFields = {};

      if (firstName !== undefined) {
        requestBody.defaultFields.firstName = firstName
          ? firstName.trim()
          : null;
      }
      if (lastName !== undefined) {
        requestBody.defaultFields.lastName = lastName ? lastName.trim() : null;
      }
      if (company !== undefined) {
        requestBody.defaultFields.company = company ? company.trim() : null;
      }
      if (role !== undefined) {
        requestBody.defaultFields.role = role ? role.trim() : null;
      }

      if (emails && Array.isArray(emails) && emails.length > 0) {
        requestBody.defaultFields.emails = (
          emails as Array<{ name: string; value?: string; id?: string }>
        ).map(
          (email): OpenPhoneEmail => ({
            name: email.name.trim(),
            value:
              email.value && email.value.trim() ? email.value.trim() : null,
            ...(email.id && { id: email.id.trim() }),
          })
        );
      }

      if (
        phoneNumbers &&
        Array.isArray(phoneNumbers) &&
        phoneNumbers.length > 0
      ) {
        requestBody.defaultFields.phoneNumbers = (
          phoneNumbers as Array<{ name: string; value?: string; id?: string }>
        ).map(
          (phone): OpenPhonePhoneNumber => ({
            name: phone.name.trim(),
            value:
              phone.value && phone.value.trim() ? phone.value.trim() : null,
            ...(phone.id && { id: phone.id.trim() }),
          })
        );
      }
    }

    if (
      customFields &&
      Array.isArray(customFields) &&
      customFields.length > 0
    ) {
      requestBody.customFields = (
        customFields as Array<{ key: string; value?: string; id?: string }>
      ).map((field) => ({
        key: field.key.trim(),
        value: field.value && field.value.trim() ? field.value.trim() : null,
        ...(field.id && { id: field.id.trim() }),
      }));
    }

    if (source !== undefined) {
      requestBody.source = source ? source.trim() : null;
    }

    if (sourceUrl !== undefined) {
      requestBody.sourceUrl =
        sourceUrl && sourceUrl.trim() ? sourceUrl.trim() : null;
    }

    if (externalId !== undefined) {
      requestBody.externalId =
        externalId && externalId.trim() ? externalId.trim() : null;
    }

    if (Object.keys(requestBody).length === 0) {
      throw new Error('At least one field must be provided to update');
    }

    try {
      const response: OpenPhoneContactResponse =
        await openPhoneCommon.makeRequest<OpenPhoneContactResponse>(
          HttpMethod.PATCH,
          `/v1/contacts/${contactId}`,
          auth,
          requestBody
        );

      return response;
    } catch (error) {
      throw new Error(`Failed to update contact: ${error}`);
    }
  },
});
