import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  Polling,
  pollingHelper,
  DedupeStrategy,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

interface Profile {
  id: string;
  type: 'profile';
  attributes: {
    email?: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    created?: string;
    updated?: string;
  };
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof klaviyoAuth>,
  { list_id: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const apiKey = auth.secret_text;
    const listId = propsValue.list_id;
    
    // Get profiles in the specific list
    const response = await httpClient.sendRequest<{ data: Profile[] }>({
      method: HttpMethod.GET,
      url: `https://a.klaviyo.com/api/lists/${listId}/profiles`,
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
      },
      queryParams: {
        'page[size]': '20',
      },
    });
    
    const profiles = response.body.data || [];
    
    // Filter profiles that were updated after the last fetch
    // Note: Klaviyo doesn't provide a direct "added to list" timestamp,
    // so we use the profile's updated time as a proxy
    const newProfiles = profiles.filter(
      (profile) => {
        const updatedTime = profile.attributes.updated 
          ? new Date(profile.attributes.updated).getTime() 
          : 0;
        return updatedTime > lastFetchEpochMS;
      }
    );
    
    return newProfiles.map((profile) => ({
      epochMilliSeconds: profile.attributes.updated 
        ? new Date(profile.attributes.updated).getTime() 
        : Date.now(),
      data: profile,
    }));
  },
};

export const profileAddedToList = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List',
  description: 'Triggers when a profile is added to a specific list in Klaviyo.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor for new profiles',
      required: true,
    }),
  },
  sampleData: {
    id: '01J0WQ1X2Z3Y4K5M6N7P8Q9R0',
    type: 'profile',
    attributes: {
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone_number: '+1234567890',
      created: '2024-01-01T12:00:00Z',
      updated: '2024-01-01T12:00:00Z',
    },
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.poll(polling, context);
  },

  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
