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
  { includeDetailedInfo: boolean }
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    // Prepare query parameters with sorting to get newest first
    const queryParams: Record<string, any> = {
      'sort': '-created_at',
      'page[size]': '100' // Maximum allowed by API
    };

    // If lastItemId exists, add it to the query parameters to only get deals after that ID
    if (lastItemId) {
      queryParams['filter[id][gt]'] = lastItemId;
    }

    // Call the Teamleader API to get deals
    const response = await teamleaderCommon.apiCall({
      auth: auth,
      method: HttpMethod.GET,
      resourceUri: '/deals.list',
      queryParams
    });

    // Map the response data to the expected format
    const deals = response.body.data;
    
    // If includeDetailedInfo is true and we have deals,
    // fetch the full deal details
    if (propsValue.includeDetailedInfo && deals.length > 0) {
      const detailedDeals = [];
      
      for (const deal of deals) {
        try {
          const detailedInfo = await teamleaderCommon.apiCall({
            auth: auth,
            method: HttpMethod.GET,
            resourceUri: '/deals.info',
            queryParams: {
              id: deal.id
            }
          });
          
          detailedDeals.push({
            id: deal.id,
            data: detailedInfo.body.data
          });
        } catch (error) {
          // If fetching details fails, use the basic deal info
          detailedDeals.push({
            id: deal.id,
            data: deal
          });
        }
      }
      
      return detailedDeals;
    }
    
    // Return basic deal information
    return deals.map((deal: any) => ({
      id: deal.id,
      data: deal
    }));
  },
};

export const newDeal = createTrigger({
  name: 'new_deal',
  displayName: 'New Deal',
  description: 'Triggers when a new deal is created in Teamleader',
  auth: teamleaderAuth,
  type: TriggerStrategy.POLLING,
  props: {
    includeDetailedInfo: Property.Checkbox({
      displayName: 'Include Detailed Information',
      description: 'Include detailed information for the deals (quotations, contact details, etc.)',
      required: false,
      defaultValue: true
    })
  },
  sampleData: {
    id: '12345678-abcd-1234-5678-1234567890cd',
    title: 'New Software Implementation',
    reference: 'DEA-2025-001',
    status: {
      id: 'open',
      name: 'Open'
    },
    lead: {
      type: 'contact',
      id: '43a6abc5-7fe1-0fa7-942f-85cc4ae5367d'
    },
    department: {
      type: 'department',
      id: '45985439-58ce-02df-2542-9dfe87ee1a39'
    },
    responsible_user: {
      type: 'user',
      id: '12345678-1234-1234-1234-123456789012'
    },
    phase: {
      type: 'dealPhase',
      id: '5296a95e-1870-01af-9f3f-fb3ef990093e'
    },
    estimated_closing_date: '2025-09-30',
    estimated_value: {
      amount: 25000.00,
      currency: 'EUR'
    },
    created_at: '2025-07-25T10:15:30+00:00',
    updated_at: '2025-07-25T10:15:30+00:00',
    source: {
      type: 'dealSource',
      id: '12345678-abcd-1234-5678-1234567890ab'
    },
    weighted_value: {
      amount: 12500.00,
      currency: 'EUR'
    },
    probability: 50
  },
  onEnable: async (context) => {
    await pollingHelper.onEnable(polling, {
      ...context,
      propsValue: {
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? false
      }
    });
  },
  onDisable: async (context) => {
    await pollingHelper.onDisable(polling, {
      ...context,
      propsValue: {
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? false
      }
    });
  },
  run: async (context) => {
    return await pollingHelper.poll(polling, {
      ...context,
      propsValue: {
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? false
      }
    });
  },
  test: async (context) => {
    return await pollingHelper.test(polling, {
      ...context,
      propsValue: {
        includeDetailedInfo: context.propsValue.includeDetailedInfo ?? false
      }
    });
  },
});
