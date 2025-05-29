import { createAction, Property } from '@activepieces/pieces-framework';
import { smashsendAuth } from '../..';
import { createClient, validateEmail } from '../common';

export const deleteContactAction = createAction({
  auth: smashsendAuth,
  name: 'delete_contact',
  displayName: 'Delete Contact',
  description: 'Deletes a contact from SMASHSEND by email address. Returns success even if contact doesn\'t exist (idempotent).',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact to delete. Must be a valid email format. Returns success even if contact doesn\'t exist.',
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
        // Contact doesn't exist - return success (idempotent behavior)
        return {
          deleted: false,
          reason: 'Contact not found',
          email: email,
        };
      }
      
      // Contact exists - delete it
      await client.contacts.delete(searchResult.id);
      return {
        deleted: true,
        reason: 'Contact successfully deleted',
        email: email,
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('not found') || error.statusCode === 404) {
        // Contact doesn't exist - return success (idempotent)
        return {
          deleted: false,
          reason: 'Contact not found',
          email: email,
        };
      }
      if (error.statusCode === 401) {
        throw new Error('Invalid API key. Please check your authentication settings.');
      }
      if (error.statusCode === 403) {
        throw new Error('API key does not have sufficient permissions to delete contacts.');
      }
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  },
}); 