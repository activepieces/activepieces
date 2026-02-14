import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoNewProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'klaviyo_new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in the account.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  onEnable: async (context) => {
    // Store the current timestamp as the starting point
    await context.store.put('lastPollTime', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastPollTime');
  },
  run: async (context) => {
    const lastPollTime = (await context.store.get('lastPollTime')) as string;
    const now = new Date().toISOString();

    const filter = `greater-than(created,${lastPollTime})`;

    const response = await klaviyoApiCall<{
      data: unknown[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: '/profiles',
      queryParams: {
        filter,
        sort: '-created',
        'page[size]': '100',
      },
    });

    await context.store.put('lastPollTime', now);
    return response.data;
  },
  test: async (context) => {
    const response = await klaviyoApiCall<{
      data: unknown[];
    }>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      path: '/profiles',
      queryParams: {
        sort: '-created',
        'page[size]': '5',
      },
    });

    return response.data;
  },
});
