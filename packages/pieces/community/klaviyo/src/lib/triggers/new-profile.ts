import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = auth as string;

    // Get profiles created after lastFetchEpochMS
    const currentTime = new Date().toISOString();
    const items: any[] = [];

    try {
      // Klaviyo API uses cursor-based pagination
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        let url = '/profiles?sort=-created';

        if (cursor) {
          url += `&page[cursor]=${cursor}`;
        }

        const response = await klaviyoCommon.makeRequest(
          apiKey,
          HttpMethod.GET,
          url
        );

        const profiles = response.body.data || [];

        for (const profile of profiles) {
          const createdDate = new Date(profile.attributes.created);
          const createdEpoch = createdDate.getTime();

          // Only include profiles created after last fetch
          if (createdEpoch > lastFetchEpochMS) {
            items.push({
              epochMilliSeconds: createdEpoch,
              data: profile,
            });
          } else {
            // Since we're sorting by -created, once we hit an older profile, we can stop
            hasMore = false;
            break;
          }
        }

        // Check if there are more pages
        cursor = response.body.links?.next ? new URL(response.body.links.next).searchParams.get('page[cursor]') : null;

        if (!cursor) {
          hasMore = false;
        }

        // Limit to prevent excessive API calls
        if (items.length > 100) {
          hasMore = false;
        }
      }

      return items;
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      return [];
    }
  },
};

export const newProfile = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    type: 'profile',
    id: 'WX7VJK',
    attributes: {
      email: 'sarah.mason@klaviyo-demo.com',
      phone_number: '+15005550006',
      external_id: 'ext_12345',
      first_name: 'Sarah',
      last_name: 'Mason',
      organization: 'Klaviyo Demo',
      title: 'Regional Manager',
      image: 'https://images.example.com/profile.jpg',
      created: '2024-01-15T10:30:00Z',
      updated: '2024-01-15T10:30:00Z',
      properties: {
        customField1: 'value1',
        customField2: 'value2',
      },
    },
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
});
