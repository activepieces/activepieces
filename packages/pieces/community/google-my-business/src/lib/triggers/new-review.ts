import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  OAuth2PropertyValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { googleBusinessCommon } from '../common/common';
import { googleAuth } from '../..';

export const newReview = createTrigger({
  name: 'new_review',
  displayName: 'New Review',
  description: 'Triggers when there is new review',
  aiMetadata: {
    description: 'Fires when a new customer review is posted for the selected Google Business Profile account and location. Each event represents one newly created review and can be used to react to incoming customer feedback.',
  },
  auth: googleAuth,
  props: {
    account: googleBusinessCommon.account,
    location: googleBusinessCommon.location,
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, ctx);
  },
  async onEnable(ctx) {
    await pollingHelper.onEnable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async onDisable(ctx) {
    await pollingHelper.onDisable(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
  async run(ctx) {
    return await pollingHelper.poll(polling, ctx);
  },
});

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof googleAuth>,
  { location: string; account: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ propsValue, lastFetchEpochMS, auth }) => {
    const items = await getResponse(
      auth,
      propsValue.location,
      propsValue.account
    );
    return items.map((item) => ({
      epochMilliSeconds: dayjs(item.createTime).valueOf(),
      data: item,
    }));
  },
};

const getResponse = async (
  authentication: OAuth2PropertyValue,
  location: string,
  account: string
) => {
  const response = await httpClient.sendRequest<{
    reviews: { createTime: string }[];
  }>({
    url: ` https://mybusiness.googleapis.com/v4/${account}/${location}/reviews`,
    method: HttpMethod.GET,
    headers: {
      Authorization: `Bearer ${authentication.access_token}`,
    },
    queryParams: {
      pageSize: '100',
      orderBy: 'updateTime desc',
    },
  });
  return response.body['reviews'] ?? [];
};
