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

interface FolkPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  createdAt: string;
  updatedAt: string;
  customFields?: Record<string, any>;
  tags?: string[];
  status?: string;
  assignee?: string;
  [key: string]: any;
}

interface FolkPeopleResponse {
  people: FolkPerson[];
  contacts?: FolkPerson[]; // Alternative API response format
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
      // Fetch people from Folk API
      const response = await folkApiCall<FolkPeopleResponse>({
        apiKey,
        method: HttpMethod.GET,
        endpoint: '/people',
        queryParams: {
          // Sort by update date to get recently updated first
          sort: 'updatedAt',
          order: 'desc',
          limit: '100'
        },
      });

      // Handle both 'people' and 'contacts' response formats
      const people = response.people || response.contacts || [];
      
      // Get stored custom field snapshots
      const storedSnapshots = await store.get<Record<string, any>>('customFieldSnapshots') || {};
      const newSnapshots: Record<string, any> = {};
      const items: Array<{ epochMilliSeconds: number; data: any }> = [];
      
      for (const person of people) {
        const updatedAtMs = new Date(person.updatedAt).getTime();
        const createdAtMs = new Date(person.createdAt).getTime();
        
        // Skip if person hasn't been updated since last fetch
        if (updatedAtMs <= lastFetchEpochMS) {
          // Still store the snapshot for tracking
          newSnapshots[person.id] = {
            customFields: person.customFields,
            tags: person.tags,
            status: person.status,
            assignee: person.assignee,
          };
          continue;
        }
        
        // Skip newly created people (not updates)
        if (updatedAtMs <= createdAtMs) {
          newSnapshots[person.id] = {
            customFields: person.customFields,
            tags: person.tags,
            status: person.status,
            assignee: person.assignee,
          };
          continue;
        }
        
        // Check if custom fields have changed
        const previousSnapshot = storedSnapshots[person.id];
        const currentSnapshot = {
          customFields: person.customFields,
          tags: person.tags,
          status: person.status,
          assignee: person.assignee,
        };
        
        newSnapshots[person.id] = currentSnapshot;
        
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
                ...person,
                previousCustomFields: previousSnapshot.customFields,
                previousTags: previousSnapshot.tags,
                previousStatus: previousSnapshot.status,
                previousAssignee: previousSnapshot.assignee,
              },
            });
          }
        } else {
          // First time seeing this person after enabling trigger
          // Include it if it was recently updated
          items.push({
            epochMilliSeconds: updatedAtMs,
            data: person,
          });
        }
      }
      
      // Store updated snapshots
      await store.put('customFieldSnapshots', newSnapshots);
      
      return items;
    } catch (error: any) {
      console.error('Error fetching updated people from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

export const personCustomFieldUpdated = createTrigger({
  auth: folkAuth,
  name: 'person-custom-field-updated',
  displayName: 'Person Custom Field Updated',
  description: 'Triggers when a person custom field (e.g., tag, status, text, assignee) is updated.',
  props: {},
  sampleData: {
    id: '67890',
    firstName: 'Jane',
    lastName: 'Smith',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1-555-0123',
    company: 'Acme Corporation',
    jobTitle: 'Marketing Director',
    createdAt: '2024-01-15T11:20:00Z',
    updatedAt: '2024-01-23T10:15:00Z',
    tags: ['lead', 'decision-maker', 'hot-lead', 'engaged'],
    status: 'Qualified',
    assignee: 'sales-rep@company.com',
    groups: ['Sales Pipeline', 'Q1 2024 Prospects', 'Priority Contacts'],
    customFields: {
      source: 'Webinar',
      leadScore: 95,
      region: 'North America',
      interests: ['Product Demo', 'Pricing', 'Enterprise Features'],
      lastContactDate: '2024-01-23',
      nextFollowUp: '2024-01-25',
      dealSize: '$50K'
    },
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/janesmith',
      twitter: '@janesmith'
    },
    previousTags: ['lead', 'decision-maker', 'hot-lead'],
    previousStatus: 'Prospect',
    previousAssignee: 'marketing@company.com',
    previousCustomFields: {
      source: 'Website',
      leadScore: 85,
      region: 'North America',
      interests: ['Product Demo', 'Pricing'],
      lastContactDate: '2024-01-20',
      nextFollowUp: '2024-01-23',
      dealSize: '$30K'
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
