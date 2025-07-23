import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon, SystemeContact } from '../common';

interface UpdateContactRequest extends Record<string, unknown> {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  locale?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export const updateContact = createAction({
  auth: systemeAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update contact fields including name, email, phone, tags, and custom fields',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Updated email address (leave empty to keep current)',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Updated first name (leave empty to keep current)',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Updated last name (leave empty to keep current)',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Updated phone number (international format recommended)',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Contact locale (e.g., "en", "fr", "en-US")',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tag names to replace current tags (leave empty to keep current)',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field data as key-value pairs (will replace existing fields)',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, email, firstName, lastName, phone, locale, tags, customFields } = context.propsValue;

    if (!systemeCommon.validateId(contactId)) {
      throw new Error('Valid contact ID is required and cannot be empty.');
    }

    if (email && !systemeCommon.validateEmail(email)) {
      throw new Error('Invalid email format provided. Please provide a valid email address.');
    }

    if (phone && !systemeCommon.validatePhoneNumber(phone)) {
      throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890).');
    }

    if (locale && !systemeCommon.validateLocale(locale)) {
      throw new Error('Invalid locale format. Use format like "en", "fr", or "en-US".');
    }

    if (customFields && !systemeCommon.validateCustomFields(customFields as Record<string, unknown>)) {
      throw new Error('Invalid custom fields format. Please ensure all keys are valid strings and values are not functions.');
    }

    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string' || !tag.trim()))) {
      throw new Error('Tags must be an array of non-empty strings.');
    }

    const updateData: UpdateContactRequest = {};
    let hasUpdates = false;

    const sanitizedEmail = systemeCommon.sanitizeString(email);
    if (sanitizedEmail) {
      updateData.email = sanitizedEmail;
      hasUpdates = true;
    }

    const sanitizedFirstName = systemeCommon.sanitizeString(firstName);
    if (sanitizedFirstName !== undefined) {
      updateData.firstName = sanitizedFirstName;
      hasUpdates = true;
    }

    const sanitizedLastName = systemeCommon.sanitizeString(lastName);
    if (sanitizedLastName !== undefined) {
      updateData.lastName = sanitizedLastName;
      hasUpdates = true;
    }

    const sanitizedPhone = systemeCommon.sanitizeString(phone);
    if (sanitizedPhone !== undefined) {
      updateData.phone = sanitizedPhone;
      hasUpdates = true;
    }

    const sanitizedLocale = systemeCommon.sanitizeString(locale);
    if (sanitizedLocale) {
      updateData.locale = sanitizedLocale;
      hasUpdates = true;
    }

    if (tags && Array.isArray(tags)) {
      const stringTags = tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
      updateData.tags = stringTags.map(tag => tag.trim());
      hasUpdates = true;
    }

    if (customFields) {
      updateData.customFields = customFields as Record<string, unknown>;
      hasUpdates = true;
    }

    if (!hasUpdates) {
      throw new Error('At least one field must be provided for update.');
    }

    try {
      const updatedContact = await systemeCommon.makeRequestWithAuth<SystemeContact>(
        context.auth,
        HttpMethod.PATCH,
        `/contacts/${contactId.trim()}`,
        updateData
      );

      return {
        success: true,
        contact: updatedContact,
        message: `Contact "${contactId}" updated successfully`,
        updatedFields: Object.keys(updateData),
      };
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error(`Contact with ID "${contactId}" not found.`);
        }
        if (error.message.includes('409') && email) {
          throw new Error(`Email "${email}" is already in use by another contact.`);
        }
      }
      throw error;
    }
  },
}); 