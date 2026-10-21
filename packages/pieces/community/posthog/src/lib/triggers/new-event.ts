import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { posthogAuth } from '../auth';
import { posthogClient } from '../common/client';
import { posthogOutputSchemas } from '../common/output-schemas';

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

const props = {
  event_name: Property.ShortText({
    displayName: 'Event Name Filter',
    description: 'Filter by specific event name (leave empty for all events)',
    required: false,
  }),
};

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof posthogAuth>,
  StaticPropsValue<typeof props>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const query: Record<string, string | number> = { limit: PAGE_SIZE };
    if (lastFetchEpochMS) {
      query['after'] = new Date(lastFetchEpochMS).toISOString();
    }
    const eventName = posthogClient.optionalText(propsValue.event_name);
    if (eventName) {
      query['event'] = eventName;
    }

    const events: Record<string, unknown>[] = [];
    let body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.GET,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['events'] }),
      query,
    });
    for (let pageNo = 1; ; pageNo++) {
      const record = posthogClient.recordOf(body);
      events.push(...posthogClient.arrayOf(record['results']).filter(posthogClient.isRecord));
      const next = posthogClient.str(record['next']);
      if (!lastFetchEpochMS || !next || pageNo >= MAX_PAGES) break;
      body = await posthogClient.requestNext({ auth: auth.props, url: next });
    }

    return events.flatMap((event) => {
      const timestamp = typeof event['timestamp'] === 'string' ? Date.parse(event['timestamp']) : NaN;
      return Number.isNaN(timestamp) ? [] : [{ epochMilliSeconds: timestamp, data: event }];
    });
  },
};

export const posthogNewEvent = createTrigger({
  auth: posthogAuth,
  name: 'new_event',
  classification: 'READ',
  displayName: 'New Event',
  description: 'Triggers when a new event is captured in PostHog',
  aiMetadata: {
    description: 'Fires when a new analytics event is captured in the connected PostHog project; polls for recently captured events and emits each one. Optionally filter to a single event name, or leave it empty to fire on every event type.',
  },
  type: TriggerStrategy.POLLING,
  outputSchema: posthogOutputSchemas.newEvent,
  props,
  sampleData: {
    id: '1',
    event: 'pageview',
    distinct_id: 'user_123',
    timestamp: '2024-01-01T00:00:00Z',
    properties: { $current_url: 'https://example.com' },
  },
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
