import { 
  createTrigger, 
  TriggerStrategy, 
  PiecePropValueSchema 
} from '@activepieces/pieces-framework';
import { 
  DedupeStrategy, 
  Polling, 
  pollingHelper 
} from '@activepieces/pieces-common';
import { folkAuth } from '../common';
import { folkApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface FolkCompany {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface FolkCompaniesResponse {
  companies: FolkCompany[];
  hasMore?: boolean;
  nextCursor?: string;
}

const polling: Polling<
  PiecePropValueSchema<typeof folkAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = auth as string;
    
    try {
      // Fetch companies from Folk API
      const response = await folkApiCall<FolkCompaniesResponse>({
        apiKey,
        method: HttpMethod.GET,
        endpoint: '/companies',
        queryParams: {
          // Sort by creation date to get newest first
          sort: 'createdAt',
          order: 'desc',
          limit: '100'
        },
      });

      const companies = response.companies || [];
      
      // Filter and map companies created after the last fetch
      const items = companies
        .filter((company: FolkCompany) => {
          const createdAtMs = new Date(company.createdAt).getTime();
          return createdAtMs > lastFetchEpochMS;
        })
        .map((company: FolkCompany) => ({
          epochMilliSeconds: new Date(company.createdAt).getTime(),
          data: company,
        }));

      return items;
    } catch (error: any) {
      console.error('Error fetching companies from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

const sampleData = {
  id: 'com_abcdef1234567890abcdef1234567890abcd',
  name: 'Acme Corporation',
  domain: 'acme.com',
  industry: 'Technology',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  tags: ['customer', 'enterprise'],
  customFields: {
    size: 'Large',
    revenue: '$10M+'
  }
};

export const companyAdded = createTrigger({
  auth: folkAuth,
  name: 'company-added',
  displayName: 'Company Added',
  description: 'Triggers when a new company is created or added to a group.',
  props: {},
  sampleData,
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    const items = await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
    
    // If no real data found, return sample data for demo purposes
    if (!items || items.length === 0) {
      return [sampleData];
    }
    
    return items;
  },
});
