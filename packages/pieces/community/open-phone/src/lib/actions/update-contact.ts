import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../auth';
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
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Update an existing contact in your OpenPhone workspace',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing OpenPhone contact identified by its contact ID, changing any of name, company, role, emails, phone numbers, custom fields, or source. Choose this to modify a contact that already exists rather than create one. Requires a valid contact ID and at least one field to change; supplied email/phone arrays replace the existing ones. Idempotent — re-applying the same field values leaves the contact in the same state.', idempotent: true },
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Contact to Update',
      icon: 'user',
      props: ['contactId'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changesNote', 'firstName', 'lastName', 'company', 'role'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Emails and Phones',
      icon: 'inbox',
      props: ['listsNote', 'emails', 'phoneNumbers'],
    },
  ],
  props: {
    contactId: contactDropdown,
    changesNote: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      width: 'half',
      required: false,
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
    listsNote: Property.MarkDown({
      value: "A list you add here replaces the contact's current list.",
      variant: MarkdownVariant.WARNING,
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
          description: 'Leave empty to remove this email.',
          placeholder: 'jane@example.com',
          required: false,
        }),
        id: Property.ShortText({
          displayName: 'Email ID',
          description: 'ID of the existing email to change.',
          required: false,
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
          description: 'Leave empty to remove this number.',
          placeholder: '+15555555555',
          required: false,
        }),
        id: Property.ShortText({
          displayName: 'Phone ID',
          description: 'ID of the existing number to change.',
          required: false,
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
          description: 'Leave empty to clear this field.',
          required: false,
        }),
        id: Property.ShortText({
          displayName: 'Field ID',
          description: 'ID of the existing custom field to change.',
          required: false,
        }),
      },
    }),
    source: Property.ShortText({
      displayName: 'Source',
      description: 'Where the contact came from.',
      advanced: true,
      required: false,
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

    const trimmedFirstName = nonEmpty(firstName);
    const trimmedLastName = nonEmpty(lastName);
    const trimmedCompany = nonEmpty(company);
    const trimmedRole = nonEmpty(role);
    const hasEmails = Array.isArray(emails) && emails.length > 0;
    const hasPhoneNumbers =
      Array.isArray(phoneNumbers) && phoneNumbers.length > 0;

    if (
      trimmedFirstName ||
      trimmedLastName ||
      trimmedCompany ||
      trimmedRole ||
      hasEmails ||
      hasPhoneNumbers
    ) {
      requestBody.defaultFields = {};

      if (trimmedFirstName) {
        requestBody.defaultFields.firstName = trimmedFirstName;
      }
      if (trimmedLastName) {
        requestBody.defaultFields.lastName = trimmedLastName;
      }
      if (trimmedCompany) {
        requestBody.defaultFields.company = trimmedCompany;
      }
      if (trimmedRole) {
        requestBody.defaultFields.role = trimmedRole;
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

    const trimmedSource = nonEmpty(source);
    if (trimmedSource) {
      requestBody.source = trimmedSource;
    }

    const trimmedSourceUrl = nonEmpty(sourceUrl);
    if (trimmedSourceUrl) {
      requestBody.sourceUrl = trimmedSourceUrl;
    }

    const trimmedExternalId = nonEmpty(externalId);
    if (trimmedExternalId) {
      requestBody.externalId = trimmedExternalId;
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

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
