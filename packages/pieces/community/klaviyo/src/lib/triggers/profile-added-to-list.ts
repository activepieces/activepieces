import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall, klaviyoCommon } from '../../common';

interface KlaviyoProfile {
  id: string;
  type: string;
  attributes: {
    email: string;
    phone_number: string;
    first_name: string;
    last_name: string;
    created: string;
    updated: string;
    [key: string]: unknown;
  };
}

const polling: Polling<{ secret_text: string }, { list: string }> = {
  strategy: DedupeStrategy.LAST_ITEM,
  async items({ auth, propsValue }) {
    const listId = propsValue.list;
    const response = await klaviyoApiCall<{ data: KlaviyoProfile[] }>(
      HttpMethod.GET,
      `lists/${listId}/profiles`,
      auth.secret_text,
      undefined,
      {
        'page[size]': '100',
        sort: '-joined_group_at',
      }
    );
    return response.body.data.map((profile) => ({
      id: profile.id,
      data: profile,
    }));
  },
};

export const profileAddedToListTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'profile_added_to_list',
  displayName: 'Profile Added to List',
  description: 'Triggers when a profile is added to a specific list.',
  props: {
    list: klaviyoCommon.lists,
  },
  sampleData: {
    id: '01EXAMPLE',
    type: 'profile',
    attributes: {
      email: 'test@example.com',
      phone_number: '+15551234567',
      first_name: 'John',
      last_name: 'Doe',
      created: '2024-01-01T00:00:00+00:00',
      updated: '2024-01-01T00:00:00+00:00',
    },
  },
  type: TriggerStrategy.POLLING,
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
