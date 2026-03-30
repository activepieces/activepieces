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

    const allEvents: { eventName: string; createdAt: string; id: string; urlPath: string }[] = [];
    let page = 1;
    const pageSize = 100;

    while (true) {
      const response = await umamiApiCall<{
        data: { eventName: string; createdAt: string; id: string; urlPath: string }[];
        count: number;
      }>({
        serverUrl: base_url,
        apiKey: api_key,
        method: HttpMethod.GET,
        path: `/websites/${propsValue.websiteId}/events`,
        queryParams: {
          startAt: String(startAt),
          endAt: String(now),
          pageSize: String(pageSize),
          page: String(page),
        },
      });

      allEvents.push(...response.body.data);

      if (response.body.data.length < pageSize) {
        break;
      }
      page++;
    }

    return allEvents.map((event) => ({
      epochMilliSeconds: new Date(event.createdAt).getTime(),
      data: {
        id: event.id,
        event_name: event.eventName,
        url_path: event.urlPath,
        created_at: event.createdAt,
      },
    }));
  },
};

export const newEvent = createTrigger({
  auth: umamiAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a new custom event is recorded on a website.',
  props,
  sampleData: {
    id: 'abc123',
    event_name: 'signup-button-click',
    url_path: '/pricing',
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
