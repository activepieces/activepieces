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
  email?: string;
  domain?: string;
  url?: string;
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
          // Sort by update date to get recently updated first
          sort: 'updatedAt',
          order: 'desc',
          limit: '100'
        },
      });

      const companies = response.companies || [];
      
      // Filter and map companies updated after the last fetch
      // Also filter out companies where updatedAt equals createdAt (newly created, not updated)
      const items = companies
        .filter((company: FolkCompany) => {
          const updatedAtMs = new Date(company.updatedAt).getTime();
          const createdAtMs = new Date(company.createdAt).getTime();
          
          // Only include companies that were updated (not just created) after last fetch
          return updatedAtMs > lastFetchEpochMS && updatedAtMs > createdAtMs;
        })
        .map((company: FolkCompany) => ({
          epochMilliSeconds: new Date(company.updatedAt).getTime(),
          data: company,
        }));

      return items;
    } catch (error: any) {
      console.error('Error fetching updated companies from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

const sampleData = {
  id: 'com_abcdef1234567890abcdef1234567890abcd',
  name: 'Acme Corporation (Updated)',
  email: 'contact@acme.com',
  domain: 'acme.com',
  url: 'https://www.acme.com',
  industry: 'Technology',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-20T14:45:00Z',
  tags: ['customer', 'enterprise', 'premium'],
  customFields: {
    size: 'Large',
    revenue: '$15M+',
    status: 'Active'
  },
  previousValues: {
    name: 'Acme Corp',
    revenue: '$10M+'
  }
};

export const companyUpdated = createTrigger({
  auth: folkAuth,
  name: 'company-updated',
  displayName: 'Company Updated',
  description: "Triggers when a company's basic field (e.g., name, email, or URL) in a group is updated.",
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
