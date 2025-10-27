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
  url?: string;
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
          // Sort by update date to get recently updated first
          sort: 'updatedAt',
          order: 'desc',
          limit: '100'
        },
      });

      // Handle both 'people' and 'contacts' response formats
      const people = response.people || response.contacts || [];
      
      // Filter and map people updated after the last fetch
      // Also filter out people where updatedAt equals createdAt (newly created, not updated)
      const items = people
        .filter((person: FolkPerson) => {
          const updatedAtMs = new Date(person.updatedAt).getTime();
          const createdAtMs = new Date(person.createdAt).getTime();
          
          // Only include people that were updated (not just created) after last fetch
          return updatedAtMs > lastFetchEpochMS && updatedAtMs > createdAtMs;
        })
        .map((person: FolkPerson) => ({
          epochMilliSeconds: new Date(person.updatedAt).getTime(),
          data: person,
        }));

      return items;
    } catch (error: any) {
      console.error('Error fetching updated people from Folk:', error);
      // Return empty array if API call fails to avoid breaking the trigger
      return [];
    }
  },
};

export const personUpdated = createTrigger({
  auth: folkAuth,
  name: 'person-updated',
  displayName: 'Person Updated',
  description: "Triggers when a person's basic field (e.g., name, job title, email, or URL) in a group is updated.",
  props: {},
  sampleData: {
    id: '67890',
    firstName: 'Jane',
    lastName: 'Smith-Johnson',
    name: 'Jane Smith-Johnson',
    email: 'jane.smithjohnson@example.com',
    phone: '+1-555-0199',
    url: 'https://janesmith.com',
    company: 'Acme Corporation',
    jobTitle: 'Senior Marketing Director',
    createdAt: '2024-01-15T11:20:00Z',
    updatedAt: '2024-01-22T14:30:00Z',
    tags: ['lead', 'decision-maker', 'key-contact'],
    groups: ['Sales Pipeline', 'Q1 2024 Prospects', 'Priority Contacts'],
    customFields: {
      source: 'Website',
      leadScore: 92,
      region: 'North America',
      interests: ['Product Demo', 'Pricing', 'Enterprise Features']
    },
    socialProfiles: {
      linkedin: 'https://linkedin.com/in/janesmith',
      twitter: '@janesmithjohnson'
    },
    previousValues: {
      lastName: 'Smith',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0123',
      jobTitle: 'Marketing Director'
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
