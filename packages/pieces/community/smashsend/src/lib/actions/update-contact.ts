import { createAction, Property } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createClient, validateEmail, createCustomPropertiesField } from '../common';

export const updateContactAction = createAction({
  auth: smashsendAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact in SMASHSEND. If the contact doesn\'t exist, it will be created automatically.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to update. Must be a valid email format.',
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
    
    if (!email || !email.trim()) {
      throw new Error('Email address is required and cannot be empty.');
    }
    
    if (!validateEmail(email)) {
      throw new Error(`Invalid email format: ${email}. Please provide a valid email address.`);
    }

    try {
      const client = createClient(context.auth.apiKey);
      
      // Build payload with only provided, non-empty fields
      const payload: any = {
        email: email.trim().toLowerCase(),
      };
      
      if (firstName) {
        payload.firstName = firstName.trim();
      }
      if (lastName) {
        payload.lastName = lastName.trim();
      }
      if (phone) {
        payload.phone = phone.trim();
      }
      if (photoUrl) {
        payload.avatarUrl = photoUrl.trim();
      }
      if (countryCode) {
        payload.countryCode = countryCode.trim().toUpperCase();
      }
      if (customProperties && Object.keys(customProperties).length > 0) {
        payload.customProperties = customProperties;
      }
      
      // Backend UPSERT: this call updates if the contact exists, or creates if not
      const contact = await client.contacts.create(payload);
      return contact;
    } catch (error: any) {
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
        throw new Error('API key does not have sufficient permissions to update contacts.');
      }
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  },
}); 