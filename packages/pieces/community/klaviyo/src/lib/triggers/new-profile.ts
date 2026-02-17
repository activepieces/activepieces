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
import { klaviyoApiCall } from '../../common';

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

const polling: Polling<{ secret_text: string }, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }) {
    const queryParams: Record<string, string> = {
      sort: '-created',
      'page[size]': lastFetchEpochMS === 0 ? '10' : '100',
    };
    if (lastFetchEpochMS > 0) {
      const since = new Date(lastFetchEpochMS).toISOString();
      queryParams['filter'] = `greater-than(created,${since})`;
    }
    const response = await klaviyoApiCall<{ data: KlaviyoProfile[] }>(
      HttpMethod.GET,
      'profiles',
      auth.secret_text,
      undefined,
      queryParams
    );
    return response.body.data.map((profile) => ({
      epochMilliSeconds: new Date(profile.attributes.created).getTime(),
      data: profile,
    }));
  },
};

export const newProfileTrigger = createTrigger({
  auth: klaviyoAuth,
  name: 'new_profile',
  displayName: 'New Profile',
  description: 'Triggers when a new profile is created in Klaviyo.',
  props: {},
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
