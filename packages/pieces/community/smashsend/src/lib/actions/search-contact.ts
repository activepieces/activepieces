import { createAction, Property } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createClient, validateEmail } from '../common';

export const searchContactAction = createAction({
  auth: smashsendAuth,
  name: 'search_contact',
  displayName: 'Search Contact',
  description: 'Search for a contact in SmashSend by email address. Returns isFound flag to indicate if contact was located (no error on not-found).',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for. Must be a valid email format. If no contact is found, returns minimal result with isFound = false.',
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

    try {
      const client = createClient(context.auth.apiKey);
      const contact = await client.contacts.search(email.toLowerCase());
      
      // If no contact found, return minimal object with isFound: false
      if (!contact) {
        return {
          isFound: false,
          id: '',
          email: email,
        };
      }
      
      // Return the contact plus an isFound flag
      return {
        isFound: true,
        ...contact,
      };
    } catch (error: any) {
      // For actual errors (not just "not found"), we still throw
      if (error.message?.includes('not found') || error.statusCode === 404) {
        // Return empty object for "not found" - this is expected behavior
        return {
          isFound: false,
          id: '',
          email: email,
        };
      }
      if (error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your authentication settings.');
      }
      if (error.statusCode === 403) {
        throw new Error('API key does not have sufficient permissions to search contacts.');
      }
      throw new Error(`Failed to search contact: ${error.message}`);
    }
  },
}); 