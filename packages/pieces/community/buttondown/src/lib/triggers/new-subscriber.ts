import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../../index';
import { buttondownRequest, ButtondownPaginatedResponse, ButtondownSubscriber } from '../common/client';

interface PollingState {
  lastSeenIds: string[];
}

export const newSubscriber = createTrigger({
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a new subscriber joins your newsletter.',
  auth: buttondownAuth,
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'abc123',
    email: 'subscriber@example.com',
    creation_date: '2026-04-19T00:00:00Z',
    secondary_id: 1,
    subscriber_type: 'regular',
    source: 'web',
    tags: [],
    utm_campaign: '',
    utm_medium: '',
    utm_source: '',
    referrer_url: '',
    metadata: {},
  },
  async onEnable(context) {
    await context.store.put<PollingState>('buttondown_state', { lastSeenIds: [] });
  },
  async onDisable(context) {
    await context.store.delete('buttondown_state');
  },
  async run(context) {
    const state = await context.store.get<PollingState>('buttondown_state') ?? { lastSeenIds: [] };
    const result = await buttondownRequest<ButtondownPaginatedResponse<ButtondownSubscriber>>(
      context.auth, HttpMethod.GET, '/subscribers'
    );
    const newSubs = result.results.filter((s) => !state.lastSeenIds.includes(s.id));
    if (newSubs.length > 0) {
      await context.store.put<PollingState>('buttondown_state', {
        lastSeenIds: result.results.map((s) => s.id),
      });
    }
    return newSubs;
  },
  async test(context) {
    const result = await buttondownRequest<ButtondownPaginatedResponse<ButtondownSubscriber>>(
      context.auth, HttpMethod.GET, '/subscribers?count=3'
    );
    return result.results;
  },
});
