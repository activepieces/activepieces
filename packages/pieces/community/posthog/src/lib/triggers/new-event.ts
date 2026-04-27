import {
  createTrigger,
  TriggerStrategy,
  StoreScope,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogNewEvent = createTrigger({
  auth: posthogAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a new event is captured in PostHog',
  type: TriggerStrategy.POLLING,
  props: {
    event_name: Property.ShortText({
      displayName: 'Event Name Filter',
      description: 'Filter by specific event name (leave empty for all events)',
      required: false,
    }),
  },
  async onEnable(context) {
    await context.store.put('lastChecked', new Date().toISOString(), StoreScope.FLOW);
  },
  async onDisable(context) {
    await context.store.delete('lastChecked', StoreScope.FLOW);
  },
  async run(context) {
    const lastChecked =
      (await context.store.get<string>('lastChecked', StoreScope.FLOW)) ||
      new Date(0).toISOString();

    const { personal_api_key, project_id, host } = context.auth;
    const baseUrl = host || 'https://app.posthog.com';

    const params = new URLSearchParams({
      after: lastChecked,
      limit: '100',
    });
    if (context.propsValue.event_name) {
      params.set('event', context.propsValue.event_name);
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${baseUrl}/api/projects/${project_id}/events/?${params.toString()}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
    });

    await context.store.put('lastChecked', new Date().toISOString(), StoreScope.FLOW);

    const events = (result.body as { results?: unknown[] })?.results ?? [];
    return events;
  },
  sampleData: {
    id: '1',
    event: 'pageview',
    distinct_id: 'user_123',
    timestamp: '2024-01-01T00:00:00Z',
    properties: { $current_url: 'https://example.com' },
  },
});
