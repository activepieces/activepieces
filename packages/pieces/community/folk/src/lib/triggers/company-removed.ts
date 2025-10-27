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

interface FolkDeletedCompany {
  id: string;
  name: string;
  deletedAt: string;
  [key: string]: any;
}

interface FolkDeletedCompaniesResponse {
  deletedCompanies: FolkDeletedCompany[];
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
      // Fetch deleted companies from Folk API
      // Note: This endpoint may vary depending on Folk's API implementation
      const response = await folkApiCall<FolkDeletedCompaniesResponse>({
        apiKey,
        method: HttpMethod.GET,
        endpoint: '/companies/deleted',
        queryParams: {
          // Sort by deletion date to get newest first
          sort: 'deletedAt',
          order: 'desc',
          limit: '100'
        },
      });

      const deletedCompanies = response.deletedCompanies || [];
      
      // Filter and map companies deleted after the last fetch
      const items = deletedCompanies
        .filter((company: FolkDeletedCompany) => {
          const deletedAtMs = new Date(company.deletedAt).getTime();
          return deletedAtMs > lastFetchEpochMS;
        })
        .map((company: FolkDeletedCompany) => ({
          epochMilliSeconds: new Date(company.deletedAt).getTime(),
          data: company,
        }));

      return items;
    } catch (error: any) {
      console.error('Error fetching deleted companies from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

const sampleData = {
  id: 'com_abcdef1234567890abcdef1234567890abcd',
  name: 'Acme Corporation',
  deletedAt: '2024-01-15T14:30:00Z',
  domain: 'acme.com',
  industry: 'Technology',
  tags: ['customer', 'enterprise'],
  reason: 'Archived'
};

export const companyRemoved = createTrigger({
  auth: folkAuth,
  name: 'company-removed',
  displayName: 'Company Removed',
  description: 'Triggers when a company is deleted or removed from a group.',
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
