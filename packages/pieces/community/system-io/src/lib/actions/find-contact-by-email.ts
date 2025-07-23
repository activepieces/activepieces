import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeAuth, systemeCommon, SystemeContactsResponse } from '../common';

export const findContactByEmail = createAction({
  auth: systemeAuth,
  name: 'find_contact_by_email',
  displayName: 'Find Contact by Email',
  description: 'Locate an existing contact by email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address to search for',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;

    if (!systemeCommon.validateEmail(email)) {
      throw new Error('Invalid email format provided. Please provide a valid email address.');
    }

    try {
      const response = await systemeCommon.makeRequest<SystemeContactsResponse>(
        context.auth,
        HttpMethod.GET,
        '/contacts',
        undefined,
        { email: email.trim() }
      );

      const contacts = response.items || [];
      
      if (contacts.length === 0) {
        return {
          success: false,
          contact: null,
          found: false,
          message: `No contact found with email "${email}"`,
        };
      }

      const contact = contacts[0];
      return {
        success: true,
        contact,
        found: true,
        message: `Contact found with email "${email}"`,
        totalResults: contacts.length,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return {
          success: false,
          contact: null,
          found: false,
          message: `No contact found with email "${email}"`,
        };
      }
      throw error;
    }
  },
}); 