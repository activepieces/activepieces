import {
  createTrigger,
  TriggerStrategy,
  PiecePropValueSchema,
  StaticPropsValue,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { appfollowAuth } from '../common/auth';
import {
  application_ext_idDropdown,
  collection_idDropdown,
  formatDate,
} from '../common/props';
import { makeRequest } from '../common/client';

const props = {
  collection_id: collection_idDropdown,
  app_ext_id: application_ext_idDropdown,
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof appfollowAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { app_ext_id } = propsValue;
    const fromDate = formatDate(lastFetchEpochMS);
    const toDate = formatDate(Date.now());
    const url = `/reviews?ext_id=${app_ext_id}&from=${fromDate}&to=${toDate}`;

    const response = await makeRequest(auth.secret_text, HttpMethod.GET, url);
    return response
      .filter((item: any) => {
        const itemEpochMS = dayjs(item.created).valueOf();
        return itemEpochMS > lastFetchEpochMS;
      })
      .map((item: any) => ({
        epochMilliSeconds: dayjs(item.created).valueOf(),
        data: item,
      }));
  },
};

export const newReview = createTrigger({
  auth: appfollowAuth,
  name: 'newReview',
  displayName: 'New Review',
  description: 'Triggered when a new review is added',
  props,
  sampleData: {
    content: '. :)',
    user_id: 18426652,
    is_answer: 0,
    app_version: '1.0',
    created: '2025-11-21 14:25:56',
    store: 'as',
    id: 400558347,
    rating_prev: 0,
    locale: 'us',
    rating: 5,
    app_id: 1881629,
    dt: '2025-10-30 01:48:11',
    title: 'Great App!',
    date: '2025-10-30',
    time: '01:48:11',
    was_changed: 0,
    updated: '2025-11-21 14:25:56',
    author: 'JohnD',
    order_num: null,
    review_id: 13331753657,
    ext_id: 6746340356,
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },

  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
