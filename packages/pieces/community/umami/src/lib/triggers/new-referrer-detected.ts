import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { umamiAuth } from '../..';
import { umamiApiCall, umamiCommon } from '../common';

const props = {
  websiteId: umamiCommon.websiteDropdown,
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof umamiAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const authProps = (
      auth as unknown as {
        props: {
          base_url: string;
          auth_mode: string;
          username?: string;
          password?: string;
          api_key?: string;
        };
      }
    ).props;

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const response = await umamiApiCall<{ x: string; y: number }[]>({
      serverUrl: authProps.base_url,
      auth: authProps,
      method: HttpMethod.GET,
      path: `/websites/${propsValue.websiteId}/metrics`,
      queryParams: {
        startAt: String(thirtyDaysAgo),
        endAt: String(now),
        type: 'referrer',
        limit: '500',
      },
    });

    return response.body
      .filter((item) => item.x !== '')
      .map((item) => ({
        id: item.x,
        data: {
          referrer: item.x,
          visitors: item.y,
        },
      }));
  },
};

export const newReferrerDetected = createTrigger({
  auth: umamiAuth,
  name: 'new_referrer_detected',
  displayName: 'New Referrer Detected',
  description:
    'Triggers when traffic from a new referring domain is detected for the first time.',
  props,
  sampleData: {
    referrer: 'news.ycombinator.com',
    visitors: 3,
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
