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
  { includeAddresses: boolean }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    // Prepare query parameters with sorting to get newest first
    const queryParams: Record<string, any> = {
      'sort': '-created_at',
      'page[size]': '100' // Maximum allowed by API
    };

    // If lastItemId exists, add it to the query parameters to only get companies after that ID
    if (lastItemId) {
      queryParams['filter[id][gt]'] = lastItemId;
    }

    // Call the Teamleader API to get companies
    const response = await teamleaderCommon.apiCall({
      auth: auth,
      method: HttpMethod.GET,
      resourceUri: '/companies.list',
      queryParams
    });

    // Map the response data to the expected format
    const companies = response.body.data;
    
    // If includeAddresses is true and we have companies with detailed info needed,
    // fetch the full company details
    if (propsValue.includeAddresses && companies.length > 0) {
      const detailedCompanies = [];
      
      for (const company of companies) {
        try {
          const detailedInfo = await teamleaderCommon.apiCall({
            auth: auth,
            method: HttpMethod.GET,
            resourceUri: '/companies.info',
            queryParams: {
              id: company.id
            }
          });
          
          detailedCompanies.push({
            id: company.id,
            data: detailedInfo.body.data
          });
        } catch (error) {
          // If fetching details fails, use the basic company info
          detailedCompanies.push({
            id: company.id,
            data: company
          });
        }
      }
      
      return detailedCompanies;
    }
    
    // Return basic company information
    return companies.map((company: any) => ({
      id: company.id,
      data: company
    }));
  },
};

export const newCompany = createTrigger({
  name: 'new_company',
  displayName: 'New Company',
  description: 'Triggers when a new company is added in Teamleader',
  auth: teamleaderAuth,
  type: TriggerStrategy.POLLING,
  props: {
    includeAddresses: Property.Checkbox({
      displayName: 'Include Address Details',
      description: 'Include detailed address information for the companies',
      required: true,
      defaultValue: true
    })
  },
  sampleData: {
    id: '87654321-abcd-1234-5678-1234567890cd',
    name: 'Acme Corporation',
    business_type: {
      type: 'business_type',
      id: 'bf954efc-6c82-4446-92fc-5790974fd6a7'
    },
    vat_number: 'US123456789',
    emails: [
      {
        type: 'primary',
        email: 'info@acmecorp.com'
      }
    ],
    telephones: [
      {
        type: 'primary',
        number: '+1234567890'
      }
    ],
    website: 'https://www.acmecorp.com',
    addresses: [
      {
        type: 'primary',
        address: {
          line_1: '100 Corporate Plaza',
          postal_code: '10001',
          city: 'New York',
          country: 'US'
        }
      }
    ],
    iban: 'US12345678901234567890',
    language: 'en',
    responsible_user: {
      type: 'user',
      id: '12345678-1234-1234-1234-123456789012'
    },
    tags: ['enterprise', 'new-client'],
    created_at: '2023-07-26T15:30:00+00:00',
    updated_at: '2023-07-26T15:30:00+00:00'
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, context);
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, context);
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, context);
  },
  test: async (context) => {
    return await pollingHelper.test(polling, context);
  },
});
