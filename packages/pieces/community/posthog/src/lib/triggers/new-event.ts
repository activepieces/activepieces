import {
  createTrigger,
  TriggerStrategy,
  Property,
  AppConnectionValueForAuthProperty,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  DedupeStrategy,
  httpClient,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { posthogAuth, PostHogAuth } from '../..';

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
    const { personal_api_key, project_id, api_host } = (auth as { props: PostHogAuth }).props;
    const apiBase = api_host || 'https://us.posthog.com';

    const queryParams: Record<string, string> = { limit: '100' };
    if (lastFetchEpochMS) {
      queryParams['after'] = new Date(lastFetchEpochMS).toISOString();
    }
    if (propsValue.event_name) {
      queryParams['event'] = propsValue.event_name;
    }

    const result = await httpClient.sendRequest<EventsResponse>({
      method: HttpMethod.GET,
      url: `${apiBase}/api/projects/${project_id}/events/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
      queryParams,
    });

    return (result.body.results ?? []).map((event) => ({
      epochMilliSeconds: new Date(event.timestamp).getTime(),
      data: event,
    }));
  },
};

export const posthogNewEvent = createTrigger({
  auth: posthogAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a new event is captured in PostHog',
  type: TriggerStrategy.POLLING,
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

type PostHogEvent = {
  id: string;
  distinct_id: string;
  event: string;
  timestamp: string;
  properties: Record<string, unknown>;
};

type EventsResponse = {
  count: number;
  next: string | null;
  results: PostHogEvent[];
};
