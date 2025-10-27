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
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = auth as string;
    
    try {
      // Fetch people from Folk API
      const response = await folkApiCall<FolkPeopleResponse>({
        apiKey,
        method: HttpMethod.GET,
        endpoint: '/people',
        queryParams: {
          // Sort by creation date to get newest first
          sort: 'createdAt',
          order: 'desc',
          limit: '100'
        },
      });

      // Handle both 'people' and 'contacts' response formats
      const people = response.people || response.contacts || [];
      
      // Filter and map people created after the last fetch
      const items = people
        .filter((person: FolkPerson) => {
          const createdAtMs = new Date(person.createdAt).getTime();
          return createdAtMs > lastFetchEpochMS;
        })
        .map((person: FolkPerson) => ({
          epochMilliSeconds: new Date(person.createdAt).getTime(),
          data: person,
        }));

      return items;
    } catch (error: any) {
      console.error('Error fetching people from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

export const personAdded = createTrigger({
  auth: folkAuth,
  name: 'person-added',
  displayName: 'Person Added',
  description: 'Triggers when a new person is created or added to a group.',
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
    updatedAt: '2024-01-15T11:20:00Z',
    tags: ['lead', 'decision-maker'],
    groups: ['Sales Pipeline', 'Q1 2024 Prospects'],
    customFields: {
      source: 'Website',
      leadScore: 85,
      region: 'North America',
      interests: ['Product Demo', 'Pricing']
    },
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/janesmith',
      twitter: '@janesmith'
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
