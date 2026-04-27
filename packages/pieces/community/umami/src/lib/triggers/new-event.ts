import {
  createTrigger,
  TriggerStrategy,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
  HttpMethod,
} from '@activepieces/pieces-common';
import { umamiAuth, UmamiAuthValue } from '../auth';
import { umamiApiCall, umamiCommon } from '../common';

const props = {
  websiteId: umamiCommon.websiteDropdown,
};

const polling: Polling<UmamiAuthValue, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const now = Date.now();
    const startAt =
      lastFetchEpochMS > 0 ? lastFetchEpochMS : now - 24 * 60 * 60 * 1000;

    const allEvents: {
      eventName: string;
      createdAt: string;
      id: string;
      urlPath: string;
    }[] = [];
    const pageSize = 20;
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await umamiApiCall<{
        data: {
          eventName: string;
          createdAt: string;
          id: string;
          urlPath: string;
        }[];
        count: number;
      }>({
        auth,
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
      hasMore = response.body.data.length === pageSize;
      page++;
    }

    return allEvents.map((event) => ({
      epochMilliSeconds: new Date(event.createdAt).getTime(),
      data: event,
    }));
  },
};

export const newEvent = createTrigger({
  auth: umamiAuth,
  name: 'new_event',
  displayName: 'New Event',
  description:
    'Triggers when a new custom event is recorded on a website.',
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
