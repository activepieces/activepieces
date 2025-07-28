import { teamleaderAuth } from '../common/auth';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  PiecePropValueSchema,
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { teamleaderCommon } from '../common/client';

const polling: Polling<
  PiecePropValueSchema<typeof teamleaderAuth>,
  { includeCompanyContacts: boolean }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    // Prepare query parameters with sorting to get newest first
    const queryParams: Record<string, any> = {
      'sort': '-created_at',
      'page[size]': '100' // Maximum allowed by API
    };

    // If lastItemId exists, add it to the query parameters to only get contacts after that ID
    if (lastItemId) {
      queryParams['filter[id][gt]'] = lastItemId;
    }

    // Call the Teamleader API to get contacts
    const response = await teamleaderCommon.apiCall({
      auth: auth,
      method: HttpMethod.GET,
      resourceUri: '/contacts.list',
      queryParams
    });

    // Map the response data to the expected format
    const contacts = response.body.data;
    
    // If includeCompanyContacts is true and we have contacts,
    // fetch company information for contacts associated with companies
    if (propsValue.includeCompanyContacts && contacts.length > 0) {
      const detailedContacts = [];
      
      for (const contact of contacts) {
        try {
          // Fetch detailed contact info
          const detailedInfo = await teamleaderCommon.apiCall({
            auth: auth,
            method: HttpMethod.GET,
            resourceUri: '/contacts.info',
            queryParams: {
              id: contact.id
            }
          });
          
          const contactWithDetails = detailedInfo.body.data;
          
          // If the contact has companies associated, fetch company info
          if (contactWithDetails.companies && contactWithDetails.companies.length > 0) {
            const companiesInfo = [];
            
            for (const companyLink of contactWithDetails.companies) {
              try {
                const companyInfo = await teamleaderCommon.apiCall({
                  auth: auth,
                  method: HttpMethod.GET,
                  resourceUri: '/companies.info',
                  queryParams: {
                    id: companyLink.company.id
                  }
                });
                
                companiesInfo.push(companyInfo.body.data);
              } catch (error) {
                // If fetching company details fails, use the basic company link info
                companiesInfo.push(companyLink.company);
              }
            }
            
            // Add the detailed company information
            contactWithDetails.detailed_companies = companiesInfo;
          }
          
          detailedContacts.push({
            id: contact.id,
            data: contactWithDetails
          });
        } catch (error) {
          // If fetching details fails, use the basic contact info
          detailedContacts.push({
            id: contact.id,
            data: contact
          });
        }
      }
      
      return detailedContacts;
    }
    
    // Return basic contact information
    return contacts.map((contact: any) => ({
      id: contact.id,
      data: contact
    }));
  },
};

export const newContact = createTrigger({
  name: 'new_contact',
  displayName: 'New Contact',
  description: 'Triggers when a new contact is created in Teamleader',
  auth: teamleaderAuth,
  type: TriggerStrategy.POLLING,
  props: {
    includeCompanyContacts: Property.Checkbox({
      displayName: 'Include Company Details',
      description: 'Include detailed company information for contacts associated with companies',
      required: false,
      defaultValue: true
    })
  },
  sampleData: {
    id: '12345678-abcd-1234-5678-1234567890ab',
    first_name: 'John',
    last_name: 'Doe',
    emails: [
      {
        type: 'primary',
        email: 'john.doe@example.com'
      }
    ],
    telephones: [
      {
        type: 'mobile',
        number: '+1234567890'
      }
    ],
    website: 'https://www.example.com',
    addresses: [
      {
        type: 'primary',
        address: {
          line_1: '123 Main St',
          postal_code: '12345',
          city: 'New York',
          country: 'US'
        }
      }
    ],
    language: 'en',
    gender: 'male',
    birthdate: '1980-01-01',
    tags: ['customer', 'new'],
    created_at: '2023-07-27T10:00:00+00:00',
    updated_at: '2023-07-27T10:00:00+00:00'
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, { ...context, propsValue: { includeCompanyContacts: context.propsValue.includeCompanyContacts ?? false } });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, { ...context, propsValue: { includeCompanyContacts: context.propsValue.includeCompanyContacts ?? false } });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, { ...context, propsValue: { includeCompanyContacts: context.propsValue.includeCompanyContacts ?? false } });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, { ...context, propsValue: { includeCompanyContacts: context.propsValue.includeCompanyContacts ?? false } });
  },
});
