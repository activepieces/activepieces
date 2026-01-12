import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { skyprepAuth } from '../common/auth';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof skyprepAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/get_users',
      {
        created_within_the_past_day: false,
        order_by_created_at_desc: true,
        limit: 100,
        include_groups: false,
        include_courses: false,
      }
    );
    return (response || [])
      .filter(
        (user: any) => dayjs(user.updated_at).valueOf() > lastFetchEpochMS
      )
      .map((user: any) => ({
        epochMilliSeconds: dayjs(user.created_at).valueOf(),
        data: user,
      }));
  },
};

export const newUser = createTrigger({
  auth: skyprepAuth,
  name: 'newUser',
  displayName: 'New User',
  description: 'Trigger when a new user is created in SkyPrep',
  props: {},
  sampleData: {
    id: 32,
    first_name: 'John',
    last_name: 'Doe',
    username: 'john.doe@skyprep.com',
    card_no: 'Emp. # 3211221',
    created_at: '2021-01-01T12:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onDisable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
