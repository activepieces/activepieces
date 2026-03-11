import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

type KlaviyoProfile = {
  id: string;
  attributes: {
    created: string;
    updated: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
};

const polling: Polling<
  PiecePropValueSchema<typeof klaviyoAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth }) {
    const response = await klaviyoApiCall<{
      data: KlaviyoProfile[];
    }>({
      apiKey: auth as string,
      method: HttpMethod.GET,
      endpoint: '/profiles',
      queryParams: {
        'page[size]': '50',
        sort: '-created',
        'fields[profile]': 'id,email,first_name,last_name,created,updated',
      },
    });

    return (response.data ?? []).map((profile) => ({
      epochMilliSeconds: new Date(profile.attributes.created).valueOf(),
      data: profile,
    }));
  },
};

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  type: TriggerStrategy.POLLING,
  props: {},
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
    return pollingHelper.test(polling, context);
  },
  async run(context) {
    return pollingHelper.poll(polling, context);
  },
  sampleData: {
    id: 'XYZABC',
    type: 'profile',
    attributes: {
      email: 'jane.doe@example.com',
      first_name: 'Jane',
      last_name: 'Doe',
      created: '2024-10-15T10:00:00+00:00',
      updated: '2024-10-15T10:00:00+00:00',
    },
  },
});
