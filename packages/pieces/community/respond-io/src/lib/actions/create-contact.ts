import { createAction, Property } from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';
import { RespondIoClient } from '../common/client';
import { 
  phoneProperty,
  emailProperty,
  firstNameProperty,
  lastNameProperty,
  fullNameProperty,
  languageProperty,
  timezoneProperty,
  validateRequiredFields,
  cleanupData,
  validateEmail,
  validatePhoneNumber,
  formatPhoneNumber,
  COMMON_FIELDS
} from '../common/utils';

export const createContactAction = createAction({
  auth: respondIoAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Respond.io',
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in international format (e.g., +1234567890). Either phone or email is required.',
      required: false
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact. Either phone or email is required.',
      required: false
    }),
    firstName: firstNameProperty,
    lastName: lastNameProperty,
    fullName: fullNameProperty,
    language: languageProperty,
    timezone: timezoneProperty,
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Additional custom fields as key-value pairs',
      required: false
    })
  },
  async run(context) {
    const {
      phone,
      email,
      firstName,
      lastName,
      fullName,
      language,
      timezone,
      customFields
    } = context.propsValue;

    const client = new RespondIoClient(context.auth);

    try {
      // Validate that at least phone or email is provided
      if (!phone && !email) {
        throw new Error('Either phone number or email address is required');
      }

      // Validate phone number format if provided
      if (phone && !validatePhoneNumber(phone)) {
        throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890)');
      }

      // Validate email format if provided
      if (email && !validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      // Build contact data
      const contactData = cleanupData({
        [COMMON_FIELDS.CONTACT.PHONE]: phone ? formatPhoneNumber(phone) : undefined,
        [COMMON_FIELDS.CONTACT.EMAIL]: email ? email.toLowerCase() : undefined,
        [COMMON_FIELDS.CONTACT.FIRST_NAME]: firstName,
        [COMMON_FIELDS.CONTACT.LAST_NAME]: lastName,
        [COMMON_FIELDS.CONTACT.FULL_NAME]: fullName,
        [COMMON_FIELDS.CONTACT.LANGUAGE]: language,
        [COMMON_FIELDS.CONTACT.TIMEZONE]: timezone,
        [COMMON_FIELDS.CONTACT.CUSTOM_FIELDS]: customFields
      });

      // Create the contact
      const response = await client.createContact(contactData);

      return {
        success: true,
        contact: response,
        message: 'Contact created successfully'
      };

    } catch (error: any) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }
});
