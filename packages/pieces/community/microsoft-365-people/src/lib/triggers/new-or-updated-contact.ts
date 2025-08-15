import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { microsoft365Auth } from '../common/auth';
import { microsoft365PeopleCommon, Contact } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof microsoft365Auth>, { folderId?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    
    try {
      
      const contacts = await microsoft365PeopleCommon.getContacts(auth, {
        folderId: propsValue.folderId,
        orderBy: 'lastModifiedDateTime desc',
        top: 100, 
      });

     
      const newOrUpdatedContacts = contacts.filter(contact => {
        if (!contact.lastModifiedDateTime && !contact.createdDateTime) {
          return false;
        }
        
        const contactTimestamp = contact.lastModifiedDateTime || contact.createdDateTime;
        const contactDate = dayjs(contactTimestamp);
        
        return contactDate.isAfter(dayjs(lastFetchEpochMS || 0));
      });

      return newOrUpdatedContacts.map((contact) => {
       
        const timestamp = contact.lastModifiedDateTime || contact.createdDateTime;
        
        return {
          epochMilliSeconds: dayjs(timestamp).valueOf(),
          data: {
            ...contact,
           
            isNew: !contact.lastModifiedDateTime || contact.createdDateTime === contact.lastModifiedDateTime,
            isUpdated: contact.lastModifiedDateTime && contact.createdDateTime !== contact.lastModifiedDateTime,
          },
        };
      });
    } catch (error) {
      throw new Error(`Failed to fetch contacts: ${error}`);
    }
  },
};

export const newOrUpdatedContact = createTrigger({
  auth: microsoft365Auth,
  name: 'newOrUpdatedContact',
  displayName: 'New or Updated Contact',
  description: 'Fires when a contact is created or updated in Microsoft 365 People',
  props: {
    folderId: Property.ShortText({
      displayName: 'Contact Folder ID',
      description: 'Monitor contacts in a specific folder (optional - leave empty to monitor all contacts)',
      required: false,
    }),
  },
  sampleData: {
    id: 'AAMkAGI2NGVhZTVlLWI1YmUtNGVkZC1iYzk4LWUwZGY5OGU4OGM3NQBGAAAAAAA7sW-Fyj6VlTqMgUXUqUWTBwD8bAWHMfPuSpqBACczrYHWAAAAAAEOAAD8bAWHMfPuSpqBACczrYHWAAF_pNzGAAA=',
    displayName: 'John Doe',
    givenName: 'John',
    surname: 'Doe',
    emailAddresses: [
      {
        address: 'john.doe@example.com',
        name: 'John Doe',
      },
    ],
    phoneNumbers: [
      {
        number: '+1 555-123-4567',
        type: 'business',
      },
    ],
    companyName: 'Acme Corporation',
    jobTitle: 'Software Engineer',
    businessAddress: {
      street: '123 Business St',
      city: 'Seattle',
      state: 'WA',
      countryOrRegion: 'United States',
      postalCode: '98101',
    },
    createdDateTime: '2023-12-01T10:00:00Z',
    lastModifiedDateTime: '2023-12-15T14:30:00Z',
    isNew: false,
    isUpdated: true,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },
  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});