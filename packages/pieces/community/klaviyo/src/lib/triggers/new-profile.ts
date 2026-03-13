import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
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

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  props: {},
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
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  async onDisable() {
    return;
  },
  async run(context) {
    const lastPollTime = (await context.store.get<string>('lastPollTime')) ?? new Date(0).toISOString();

    const response = await klaviyoApiCall<KlaviyoProfilesResponse>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: '/profiles',
      queryParams: {
        sort: '-created',
        'page[size]': '50',
        filter: `greater-than(created,${lastPollTime})`,
      },
    });

    const profiles = response.data ?? [];
    if (profiles.length > 0) {
      await context.store.put('lastPollTime', new Date().toISOString());
    }

    return profiles;
  },
  async test(context) {
    const response = await klaviyoApiCall<KlaviyoProfilesResponse>({
      method: HttpMethod.GET,
      apiKey: context.auth,
      path: '/profiles',
      queryParams: {
        sort: '-created',
        'page[size]': '5',
      },
    });
    return response.data ?? [];
  },
});
