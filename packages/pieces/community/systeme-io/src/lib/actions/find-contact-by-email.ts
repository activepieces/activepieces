import { createAction, Property } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

export const findContactByEmail = createAction({
  auth: systemeIoAuth,
  name: 'findContactByEmail',
  displayName: 'Find Contact by Email',
  description: 'Locate an existing contact by email address',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address to search for',
      required: true,
    }),
  },
  async run(context) {
    const { email } = context.propsValue;
    const searchEmail = email.toLowerCase().trim();
    
    const allContacts: any[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    
    while (hasMore) {
      const response = await systemeIoCommon.getContacts({
        auth: context.auth,
        limit: 100,
        startingAfter,
      });
      
      let contacts: any[] = [];
      let nextHasMore = false;
      
      if (Array.isArray(response)) {
        contacts = response;
      } else if (response && typeof response === 'object' && response !== null) {
        const responseAny = response as any;
        if (responseAny.items && Array.isArray(responseAny.items)) {
          contacts = responseAny.items;
        }
        nextHasMore = responseAny.hasMore || false;
      }
      
      allContacts.push(...contacts);
      
      if (nextHasMore && contacts.length > 0) {
        startingAfter = contacts[contacts.length - 1].id?.toString();
      } else {
        hasMore = false;
      }
    }
    
    const foundContact = allContacts.find(contact => 
      contact.email && contact.email.toLowerCase().trim() === searchEmail
    );
    
    if (foundContact) {
      return {
        success: true,
        contact: foundContact,
        message: 'Contact found successfully',
      };
    } else {
      return {
        success: false,
        contact: null,
        message: `No contact found with email: ${email}`,
      };
    }
  },
});
