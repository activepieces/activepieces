import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon, SystemeContact } from '../common';

interface CreateContactRequest extends Record<string, unknown> {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export const createContact = createAction({
  auth: systemeAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact with email, name, and optional tags',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone number (international format recommended)',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tag names to assign to the contact',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom field data as key-value pairs',
      required: false,
    }),
  },
  async run(context) {
    const { email, firstName, lastName, phone, tags, customFields } = context.propsValue;

    if (!systemeCommon.validateEmail(email)) {
      throw new Error('Invalid email format provided. Please provide a valid email address.');
    }

    if (phone && !systemeCommon.validatePhoneNumber(phone)) {
      throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890).');
    }

    if (customFields && !systemeCommon.validateCustomFields(customFields as Record<string, unknown>)) {
      throw new Error('Invalid custom fields format. Please ensure all keys are valid strings and values are not functions.');
    }

    if (tags && (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string' || !tag.trim()))) {
      throw new Error('Tags must be an array of non-empty strings.');
    }

    const contactData: CreateContactRequest = {
      email: email.trim(),
    };

    const sanitizedFirstName = systemeCommon.sanitizeString(firstName);
    if (sanitizedFirstName) {
      contactData.firstName = sanitizedFirstName;
    }

    const sanitizedLastName = systemeCommon.sanitizeString(lastName);
    if (sanitizedLastName) {
      contactData.lastName = sanitizedLastName;
    }

    const sanitizedPhone = systemeCommon.sanitizeString(phone);
    if (sanitizedPhone) {
      contactData.phone = sanitizedPhone;
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      const stringTags = tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
      contactData.tags = stringTags.map(tag => tag.trim());
    }

    if (customFields) {
      contactData.customFields = customFields as Record<string, unknown>;
    }

    try {
      const contact = await systemeCommon.makeRequestWithAuth<SystemeContact>(
        context.auth,
        HttpMethod.POST,
        '/contacts',
        contactData
      );

      return {
        success: true,
        contact,
        message: `Contact "${email}" created successfully`,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('409')) {
        throw new Error(`Contact with email "${email}" already exists. Use update contact action instead.`);
      }
      throw error;
    }
  },
}); 