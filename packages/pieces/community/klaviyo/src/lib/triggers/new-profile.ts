import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const newProfile = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    type: 'profile',
    id: 'EXAMPLE_ID',
    attributes: {
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      created: '2024-01-01T00:00:00+00:00',
    },
  },
  onEnable: async (context) => {
    await context.store.put('lastCreatedAt', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastCreatedAt');
  },
  run: async (context) => {
    const lastCreatedAt =
      (await context.store.get<string>('lastCreatedAt')) ??
      new Date(0).toISOString();

    const response = await klaviyoApiCall<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>(
      context.auth as string,
      HttpMethod.GET,
      '/profiles',
      undefined,
      {
        filter: `greater-than(created,${lastCreatedAt})`,
        sort: '-created',
        'page[size]': '100',
      },
    );

    const profiles = response.data ?? [];

    if (profiles.length > 0) {
      const newestCreated = profiles[0]?.attributes?.['created'] as string;
      if (newestCreated) {
        await context.store.put('lastCreatedAt', newestCreated);
      }
    }

    return profiles.map((profile) => ({
      ...profile,
      ...profile.attributes,
    }));
  },
  test: async (context) => {
    const response = await klaviyoApiCall<{
      data: Array<{ id: string; attributes: Record<string, unknown> }>;
    }>(
      context.auth as string,
      HttpMethod.GET,
      '/profiles',
      undefined,
      {
        sort: '-created',
        'page[size]': '5',
      },
    );

    return (response.data ?? []).map((profile) => ({
      ...profile,
      ...profile.attributes,
    }));
  },
});
