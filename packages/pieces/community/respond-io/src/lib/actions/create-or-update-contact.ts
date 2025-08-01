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

export const createOrUpdateContactAction = createAction({
  auth: respondIoAuth,
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Create a new contact or update an existing one based on phone number or email',
  props: {
    identifierType: Property.StaticDropdown({
      displayName: 'Identifier Type',
      description: 'How to identify the contact for updating',
      required: true,
      options: {
        options: [
          { label: 'Phone Number', value: 'phone' },
          { label: 'Email', value: 'email' },
          { label: 'Contact ID', value: 'id' }
        ]
      }
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in international format (e.g., +1234567890)',
      required: false
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The unique identifier of the contact',
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
      identifierType,
      phone,
      email,
      contactId,
      firstName,
      lastName,
      fullName,
      language,
      timezone,
      customFields
    } = context.propsValue;

    const client = new RespondIoClient(context.auth);

    try {
      let existingContact = null;
      let identifier = '';

      // Validate identifier based on type
      switch (identifierType) {
        case 'phone':
          if (!phone) {
            throw new Error('Phone number is required when using phone as identifier');
          }
          if (!validatePhoneNumber(phone)) {
            throw new Error('Invalid phone number format. Please use international format (e.g., +1234567890)');
          }
          identifier = formatPhoneNumber(phone);
          break;

        case 'email':
          if (!email) {
            throw new Error('Email is required when using email as identifier');
          }
          if (!validateEmail(email)) {
            throw new Error('Invalid email format');
          }
          identifier = email.toLowerCase();
          break;

        case 'id':
          if (!contactId) {
            throw new Error('Contact ID is required when using ID as identifier');
          }
          identifier = contactId;
          break;

        default:
          throw new Error('Invalid identifier type');
      }

      // Try to find existing contact
      try {
        if (identifierType === 'id') {
          existingContact = await client.getContact(contactId!);
        } else {
          const searchParams = identifierType === 'phone' 
            ? { phone: identifier } 
            : { email: identifier };
          
          const searchResult = await client.searchContacts(searchParams);
          if (searchResult.data && searchResult.data.length > 0) {
            existingContact = searchResult.data[0];
          }
        }
      } catch (error: any) {
        // Contact not found, we'll create a new one
        if (!error.message.includes('not found') && !error.message.includes('404')) {
          throw error;
        }
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

      let response;
      let operation;

      if (existingContact) {
        // Update existing contact
        response = await client.updateContact(existingContact.id, contactData);
        operation = 'updated';
      } else {
        // Create new contact
        // Ensure we have at least phone or email for creation
        if (!contactData[COMMON_FIELDS.CONTACT.PHONE] && !contactData[COMMON_FIELDS.CONTACT.EMAIL]) {
          throw new Error('Either phone number or email address is required for contact creation');
        }
        
        response = await client.createContact(contactData);
        operation = 'created';
      }

      return {
        success: true,
        contact: response,
        operation,
        message: `Contact ${operation} successfully`,
        wasExisting: !!existingContact
      };

    } catch (error: any) {
      throw new Error(`Failed to create or update contact: ${error.message}`);
    }
  }
});
