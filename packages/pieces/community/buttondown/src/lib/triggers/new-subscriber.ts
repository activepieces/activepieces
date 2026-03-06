import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { buttondownAuth } from '../auth';
import { buttondownApiRequest } from '../common';

interface ButtondownSubscriber {
  id: string;
  email_address: string;
  creation_date: string;
  notes: string;
  metadata: Record<string, unknown>;
  tags: string[];
  subscriber_type: string;
}

interface ButtondownListResponse {
  count: number;
  results: ButtondownSubscriber[];
}

export const newSubscriber = createTrigger({
  auth: buttondownAuth,
  name: 'new_subscriber',
  displayName: 'New Subscriber',
  description: 'Triggers when a new subscriber is added to your newsletter',
  props: {},
  sampleData: {
    id: 'abc-123',
    email_address: 'test@example.com',
    creation_date: '2026-01-01T00:00:00Z',
    notes: '',
    metadata: {},
    tags: [],
    subscriber_type: 'regular',
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    await context.store.put('lastCreated', new Date().toISOString());
  },
  async onDisable(context) {
    await context.store.delete('lastCreated');
  },
  async run(context) {
    const lastCreated =
      (await context.store.get<string>('lastCreated')) ??
      new Date(0).toISOString();

    const response = await buttondownApiRequest<ButtondownListResponse>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/subscribers',
      queryParams: {
        ordering: '-creation_date',
      },
    });

    const newSubscribers = response.results.filter(
      (sub) => new Date(sub.creation_date) > new Date(lastCreated)
    );

    if (newSubscribers.length > 0) {
      await context.store.put(
        'lastCreated',
        newSubscribers[0].creation_date
      );
    }

    return newSubscribers.map((sub) => sub);
  },
  async test(context) {
    const response = await buttondownApiRequest<ButtondownListResponse>({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/subscribers',
      queryParams: {
        ordering: '-creation_date',
        page_size: '5',
      },
    });

    return response.results;
  },
});
