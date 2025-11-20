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
import { makeClient, klaviyoCommon } from '../common';
import { KlaviyoProfile } from '../common/types';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof klaviyoAuth>, { listId: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue }) => {
    const client = makeClient(auth);
    const response = await client.getListProfiles(propsValue.listId);

    const profiles = response.data || [];

    // Return profiles with timestamps
    return profiles.map((profile) => ({
      epochMilliSeconds: dayjs().valueOf(), // Current timestamp
      data: profile,
    }));
  },
};

export const profileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'klaviyo_profile_added_to_list',
  displayName: 'Profile Added to List',
  description: 'Triggers when a profile is added to a specific list or segment.',
  type: TriggerStrategy.POLLING,
  props: {
    listId: klaviyoCommon.listId(true),
  },
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

