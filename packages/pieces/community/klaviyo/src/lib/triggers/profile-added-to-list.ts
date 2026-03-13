import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoApiCall } from '../common/common';

interface KlaviyoProfilesResponse {
  data: Array<{
    id: string;
    type: string;
    attributes: {
      email?: string;
      phone_number?: string;
      first_name?: string;
      last_name?: string;
      created: string;
      updated: string;
    };
  }>;
}

export const profileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List / Segment',
  description: 'Triggers when a profile is added to a specific Klaviyo list or segment.',
  props: {
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'The Klaviyo list or segment ID to monitor.',
      required: true,
    }),
  },
  sampleData: {
    id: 'abc123',
    type: 'profile',
    attributes: {
      email: 'example@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      created: '2024-01-01T00:00:00+00:00',
      updated: '2024-01-01T00:00:00+00:00',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('seenProfileIds', []);
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const listId = context.propsValue.list_id;
    const seenIds = (await context.store.get<string[]>('seenProfileIds')) ?? [];

    const response = await klaviyoApiCall<KlaviyoProfilesResponse>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: `/lists/${listId}/profiles`,
      queryParams: {
        sort: '-updated',
        'page[size]': '50',
      },
    });

    const profiles = response.data ?? [];
    const newProfiles = profiles.filter((p) => !seenIds.includes(p.id));

    if (newProfiles.length > 0) {
      const allIds = [...seenIds, ...newProfiles.map((p) => p.id)].slice(-500);
      await context.store.put('seenProfileIds', allIds);
    }

    return newProfiles;
  },
  async test(context) {
    const listId = context.propsValue.list_id;

    const response = await klaviyoApiCall<KlaviyoProfilesResponse>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: `/lists/${listId}/profiles`,
      queryParams: {
        sort: '-updated',
        'page[size]': '5',
      },
    });
    return response.data ?? [];
  },
});
