import {
  createTrigger,
  TriggerStrategy,
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
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = auth.secret_text;
    const response = await httpClient.sendRequest<{ data: Profile[] }>({
      method: HttpMethod.GET,
      url: 'https://a.klaviyo.com/api/profiles',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
      },
      queryParams: {
        'sort': '-created',
        'page[size]': '20',
      },
    });
    const profiles = response.body.data;
    const newProfiles = profiles.filter(
      (profile) => profile.attributes.created && new Date(profile.attributes.created).getTime() > lastFetchEpochMS
    );
    return newProfiles.map((profile) => ({
      epochMilliSeconds: profile.attributes.created ? new Date(profile.attributes.created).getTime() : Date.now(),
      data: profile,
    }));
  },
};

export const newProfile = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  props: {},
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
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});