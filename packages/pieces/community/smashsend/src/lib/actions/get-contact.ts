import { createAction, Property } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createClient, validateEmail } from '../common';

export const getContactAction = createAction({
  auth: smashsendAuth,
  name: 'get_contact',
  displayName: 'Get Contact',
  description: 'Gets a contact from SMASHSEND by email address.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to retrieve. Must be a valid email format.',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email?.trim();
    
    if (!email) {
      throw new Error('Email address is required and cannot be empty.');
    }
    
    if (!validateEmail(email)) {
      throw new Error(`Invalid email format: ${email}. Please provide a valid email address.`);
    }

    const client = createClient(context.auth.apiKey);

    try {
      // First, search for the contact by email
      const searchResult = await client.contacts.search(email.toLowerCase());
      
      if (!searchResult || !searchResult.id) {
        throw new Error(`No contact found with email: ${email}`);
      }
      
      // Then get the full contact details using the ID
      const contact = await client.contacts.get(searchResult.id);
      return contact;
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.message?.includes('not found') || error.statusCode === 404) {
        throw new Error(`No contact found with email: ${email}`);
      }
      if (error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your authentication settings.');
      }
      if (error.statusCode === 403) {
        throw new Error('API key does not have sufficient permissions to get contacts.');
      }
      throw new Error(`Failed to get contact: ${error.message}`);
    }
  },
}); 