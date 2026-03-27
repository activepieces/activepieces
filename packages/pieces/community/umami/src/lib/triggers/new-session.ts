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
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const { base_url, api_key } = (auth as unknown as { props: { base_url: string; api_key: string } }).props;
    const now = Date.now();
    const startAt = lastFetchEpochMS > 0 ? lastFetchEpochMS : now - 24 * 60 * 60 * 1000;

    const response = await umamiApiCall<{
      data: {
        id: string;
        browser: string;
        os: string;
        device: string;
        country: string;
        createdAt: string;
      }[];
      count: number;
    }>({
      serverUrl: base_url,
      apiKey: api_key,
      method: HttpMethod.GET,
      path: `/websites/${propsValue.websiteId}/sessions`,
      queryParams: {
        startAt: String(startAt),
        endAt: String(now),
        pageSize: '100',
      },
    });

    return response.body.data.map((session) => ({
      epochMilliSeconds: new Date(session.createdAt).getTime(),
      data: {
        id: session.id,
        browser: session.browser,
        os: session.os,
        device: session.device,
        country: session.country ?? null,
        created_at: session.createdAt,
      },
    }));
  },
};

export const newSession = createTrigger({
  auth: umamiAuth,
  name: 'new_session',
  displayName: 'New Session',
  description: 'Triggers when a new visitor session is detected on a website.',
  props,
  sampleData: {
    id: 'session-abc123',
    browser: 'Chrome',
    os: 'Windows 11',
    device: 'desktop',
    country: 'FR',
    created_at: '2024-01-15T10:30:00Z',
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
