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
  customFields?: Record<string, any>;
  tags?: string[];
  status?: string;
  assignee?: string;
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
  items: async ({ auth, lastFetchEpochMS, store }) => {
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
      
      // Get stored custom field snapshots
      const storedSnapshots = await store.get<Record<string, any>>('customFieldSnapshots') || {};
      const newSnapshots: Record<string, any> = {};
      const items: Array<{ epochMilliSeconds: number; data: any }> = [];
      
      for (const company of companies) {
        const updatedAtMs = new Date(company.updatedAt).getTime();
        const createdAtMs = new Date(company.createdAt).getTime();
        
        // Skip if company hasn't been updated since last fetch
        if (updatedAtMs <= lastFetchEpochMS) {
          // Still store the snapshot for tracking
          newSnapshots[company.id] = {
            customFields: company.customFields,
            tags: company.tags,
            status: company.status,
            assignee: company.assignee,
          };
          continue;
        }
        
        // Skip newly created companies (not updates)
        if (updatedAtMs <= createdAtMs) {
          newSnapshots[company.id] = {
            customFields: company.customFields,
            tags: company.tags,
            status: company.status,
            assignee: company.assignee,
          };
          continue;
        }
        
        // Check if custom fields have changed
        const previousSnapshot = storedSnapshots[company.id];
        const currentSnapshot = {
          customFields: company.customFields,
          tags: company.tags,
          status: company.status,
          assignee: company.assignee,
        };
        
        newSnapshots[company.id] = currentSnapshot;
        
        // If we have a previous snapshot, check if custom fields changed
        if (previousSnapshot) {
          const hasCustomFieldChange = 
            JSON.stringify(previousSnapshot.customFields) !== JSON.stringify(currentSnapshot.customFields) ||
            JSON.stringify(previousSnapshot.tags) !== JSON.stringify(currentSnapshot.tags) ||
            previousSnapshot.status !== currentSnapshot.status ||
            previousSnapshot.assignee !== currentSnapshot.assignee;
          
          if (hasCustomFieldChange) {
            items.push({
              epochMilliSeconds: updatedAtMs,
              data: {
                ...company,
                previousCustomFields: previousSnapshot.customFields,
                previousTags: previousSnapshot.tags,
                previousStatus: previousSnapshot.status,
                previousAssignee: previousSnapshot.assignee,
              },
            });
          }
        } else {
          // First time seeing this company after enabling trigger
          // Include it if it was recently updated
          items.push({
            epochMilliSeconds: updatedAtMs,
            data: company,
          });
        }
      }
      
      // Store updated snapshots
      await store.put('customFieldSnapshots', newSnapshots);
      
      return items;
    } catch (error: any) {
      console.error('Error fetching updated companies from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

export const companyCustomFieldUpdated = createTrigger({
  auth: folkAuth,
  name: 'company-custom-field-updated',
  displayName: 'Company Custom Field Updated',
  description: 'Triggers when a company custom field (e.g., tag, status, text, assignee) is updated.',
  props: {},
  sampleData: {
    id: '12345',
    name: 'Acme Corporation',
    email: 'contact@acme.com',
    domain: 'acme.com',
    url: 'https://www.acme.com',
    industry: 'Technology',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-22T09:15:00Z',
    tags: ['customer', 'enterprise', 'premium', 'vip'],
    status: 'Active',
    assignee: 'john.doe@company.com',
    customFields: {
      accountSize: 'Large',
      revenue: '$15M+',
      priority: 'High',
      region: 'North America',
      renewalDate: '2025-06-01'
    },
    previousTags: ['customer', 'enterprise', 'premium'],
    previousStatus: 'Prospect',
    previousAssignee: 'jane.smith@company.com',
    previousCustomFields: {
      accountSize: 'Medium',
      revenue: '$10M+',
      priority: 'Medium',
      region: 'North America',
      renewalDate: '2025-06-01'
    }
  },
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
    // Clean up stored snapshots
    await context.store.delete('customFieldSnapshots');
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
    return await pollingHelper.test(polling, {
      store: context.store,
      auth: context.auth,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
});
