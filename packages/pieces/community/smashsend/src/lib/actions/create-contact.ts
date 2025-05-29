import { smashsendAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient, validateEmail, createCustomPropertiesField } from '../common';

export const createContactAction = createAction({
  auth: smashsendAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new contact in SMASHSEND.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact. Must be a valid email format.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact (include country code for best results).',
      required: false,
    }),
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      description: 'URL to the contact\'s profile photo or avatar.',
      required: false,
    }),
    countryCode: Property.ShortText({
      displayName: 'Country Code',
      description: 'Two-letter ISO country code (e.g., US, GB, FR).',
      required: false,
    }),
    customProperties: createCustomPropertiesField(),
  },
  async run(context) {
    const { email, firstName, lastName, phone, photoUrl, countryCode, customProperties } = context.propsValue;
    
    if (!validateEmail(email)) {
      throw new Error(`Invalid email format: ${email}. Please provide a valid email address.`);
    }

    try {
      const client = createClient(context.auth.apiKey);
      
      const contactData: any = {
        email: email.trim().toLowerCase(),
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(phone && { phone: phone.trim() }),
        ...(photoUrl && { avatarUrl: photoUrl.trim() }),
        ...(countryCode && { countryCode: countryCode.trim().toUpperCase() }),
        ...(customProperties && Object.keys(customProperties).length > 0 && { customProperties }),
      };

      const contact = await client.contacts.create(contactData);
      
      return contact;
    } catch (error: any) {
      if (error.message?.includes('already exists')) {
        throw new Error(`A contact with email ${email} already exists. Use the "Update Contact" action instead.`);
      }
      if (error.message?.includes('invalid email')) {
        throw new Error(`Invalid email address: ${email}. Please check the email format.`);
      }
      if (error.message?.includes('invalid country')) {
        throw new Error(`Invalid country code: ${countryCode}. Please use a two-letter ISO country code (e.g., US, GB, FR).`);
      }
      if (error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your authentication settings.');
      }
      if (error.statusCode === 403) {
        throw new Error('API key does not have sufficient permissions to create contacts.');
      }
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  },
}); 