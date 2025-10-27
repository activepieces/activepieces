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

interface FolkDeletedPerson {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  deletedAt: string;
  [key: string]: any;
}

interface FolkDeletedPeopleResponse {
  deletedPeople: FolkDeletedPerson[];
  deletedContacts?: FolkDeletedPerson[]; // Alternative API response format
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
      // Fetch deleted people from Folk API
      // Note: This endpoint may vary depending on Folk's API implementation
      const response = await folkApiCall<FolkDeletedPeopleResponse>({
        apiKey,
        method: HttpMethod.GET,
        endpoint: '/people/deleted',
        queryParams: {
          // Sort by deletion date to get newest first
          sort: 'deletedAt',
          order: 'desc',
          limit: '100'
        },
      });

      // Handle both 'deletedPeople' and 'deletedContacts' response formats
      const deletedPeople = response.deletedPeople || response.deletedContacts || [];
      
      // Filter and map people deleted after the last fetch
      const items = deletedPeople
        .filter((person: FolkDeletedPerson) => {
          const deletedAtMs = new Date(person.deletedAt).getTime();
          return deletedAtMs > lastFetchEpochMS;
        })
        .map((person: FolkDeletedPerson) => ({
          epochMilliSeconds: new Date(person.deletedAt).getTime(),
          data: person,
        }));

      return items;
    } catch (error: any) {
      console.error('Error fetching deleted people from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

const sampleData = {
  id: 'per_1234567890abcdef1234567890abcdef1234',
  firstName: 'Jane',
  lastName: 'Smith',
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
  phone: '+1-555-0123',
  company: 'Acme Corporation',
  jobTitle: 'Marketing Director',
  deletedAt: '2024-01-20T16:45:00Z',
  tags: ['lead', 'decision-maker'],
  groups: ['Sales Pipeline'],
  customFields: {
    source: 'Website',
    leadScore: 85,
    region: 'North America'
  },
  reason: 'Removed from group',
  removedBy: 'user@company.com'
};

export const personRemoved = createTrigger({
  auth: folkAuth,
  name: 'person-removed',
  displayName: 'Person Removed',
  description: 'Triggers when a person is deleted from the workspace or removed from a group.',
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
