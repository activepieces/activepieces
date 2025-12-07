import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { klaviyoCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<string, { list_id: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const apiKey = auth as string;
    const { list_id } = propsValue;

    const items: any[] = [];

    try {
      // Get profiles in the list
      let cursor: string | null = null;
      let hasMore = true;

      while (hasMore) {
        let url = `/lists/${list_id}/profiles?sort=-joined_group_at`;

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
          // Use the profile's joined_group_at timestamp
          const joinedDate = profile.attributes.joined_group_at
            ? new Date(profile.attributes.joined_group_at)
            : new Date(profile.attributes.updated || profile.attributes.created);

          const joinedEpoch = joinedDate.getTime();

          // Only include profiles that joined after last fetch
          if (joinedEpoch > lastFetchEpochMS) {
            items.push({
              epochMilliSeconds: joinedEpoch,
              data: {
                profile,
                list_id,
                joined_at: joinedDate.toISOString(),
              },
            });
          } else {
            // Since we're sorting by -joined_group_at, we can stop when we hit older profiles
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
      console.error('Error fetching list profiles:', error);
      return [];
    }
  },
};

export const profileAddedToList = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List',
  description: 'Triggers when a profile is added to a specific list or segment',
  type: TriggerStrategy.POLLING,
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The ID of the list to monitor',
      required: true,
    }),
  },
  sampleData: {
    profile: {
      type: 'profile',
      id: 'WX7VJK',
      attributes: {
        email: 'sarah.mason@klaviyo-demo.com',
        phone_number: '+15005550006',
        first_name: 'Sarah',
        last_name: 'Mason',
        joined_group_at: '2024-01-15T10:30:00Z',
      },
    },
    list_id: 'XyZ123',
    joined_at: '2024-01-15T10:30:00Z',
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
