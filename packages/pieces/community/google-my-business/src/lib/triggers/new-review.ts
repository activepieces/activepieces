import {
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  OAuth2PropertyValue,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { googleBussinessCommon } from '../common/common';
import { googleAuth } from '../..';

export const newReview = createTrigger({
  name: 'new_review',
  displayName: 'New Review',
  description: 'Triggers when there is new review',
  auth: googleAuth,
  props: {
    account: googleBussinessCommon.account,
    location: googleBussinessCommon.location,
  },
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async test(ctx) {
    return await pollingHelper.test(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
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
    return await pollingHelper.poll(polling, {
      auth: ctx.auth,
      store: ctx.store,
      propsValue: ctx.propsValue,
    });
  },
});

const polling: Polling<
  OAuth2PropertyValue,
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
