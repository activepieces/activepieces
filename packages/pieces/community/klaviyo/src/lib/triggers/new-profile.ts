import { klaviyoAuth } from '../..';
import {
  TriggerStrategy,
  createTrigger,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { makeClient } from '../common';
import { KlaviyoProfile } from '../common/types';

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue, lastItemId }) => {
    const client = makeClient(auth);
    const response = await client.listProfiles(100);

    const profiles = response.data || [];

    // Sort by ID (newer profiles have higher IDs typically)
    const sortedProfiles = profiles.sort((a, b) => {
      const idA = parseInt(a.id || '0');
      const idB = parseInt(b.id || '0');
      return idB - idA;
    });

    // If we have a lastItemId, only return profiles created after it
    if (lastItemId) {
      const lastId = parseInt(lastItemId as string);
      const newProfiles = sortedProfiles.filter((profile) => {
        const profileId = parseInt(profile.id || '0');
        return profileId > lastId;
      });
      return newProfiles.map((profile) => ({
        id: profile.id!,
        data: profile,
      }));
    }

    // First run - return the most recent profile only to establish baseline
    if (sortedProfiles.length > 0) {
      return [
        {
          id: sortedProfiles[0].id!,
          data: sortedProfiles[0],
        },
      ];
    }

    return [];
  },
};

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'klaviyo_new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    type: 'profile',
    id: '01HXYZ123ABC',
    attributes: {
      email: 'user@example.com',
      phone_number: '+12345678900',
      external_id: 'user123',
      first_name: 'John',
      last_name: 'Doe',
      organization: 'Acme Inc',
      title: 'Developer',
      image: 'https://example.com/image.jpg',
      created: '2024-01-01T00:00:00Z',
      updated: '2024-01-01T00:00:00Z',
      location: {
        address1: '123 Main St',
        city: 'New York',
        region: 'NY',
        country: 'US',
        zip: '10001',
      },
      properties: {
        custom_field: 'value',
      },
    },
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
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
});

