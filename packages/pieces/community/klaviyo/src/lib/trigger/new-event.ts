import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  Polling,
  pollingHelper,
  DedupeStrategy,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { klaviyoAuth } from '../..';

interface Event {
  id: string;
  type: 'event';
  attributes: {
    metric: {
      data: {
        type: 'metric';
        attributes: {
          name: string;
        };
      };
    };
    profile: {
      data: {
        type: 'profile';
        attributes: {
          email?: string;
        };
      };
    };
    properties: Record<string, unknown>;
    value?: number;
    time: string;
    unique_id?: string;
  };
}

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof klaviyoAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const apiKey = auth.secret_text;
    const response = await httpClient.sendRequest<{ data: Event[] }>({
      method: HttpMethod.GET,
      url: 'https://a.klaviyo.com/api/events',
      headers: {
        'Accept': 'application/json',
        'Revision': '2024-10-15',
        'Authorization': `Klaviyo-API-Key ${apiKey}`,
      },
      queryParams: {
        'sort': '-time',
        'page[size]': '20',
      },
    });
    const events = response.body.data;
    const newEvents = events.filter(
      (event) => new Date(event.attributes.time).getTime() > lastFetchEpochMS
    );
    return newEvents.map((event) => ({
      epochMilliSeconds: new Date(event.attributes.time).getTime(),
      data: event,
    }));
  },
};

export const newEvent = createTrigger({
  auth: klaviyoAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a new event is tracked in Klaviyo.',
  props: {},
  sampleData: {
    id: '01J0WQ1X2Z3Y4K5M6N7P8Q9R0',
    type: 'event',
    attributes: {
      metric: {
        data: {
          type: 'metric',
          attributes: {
            name: 'Order Completed',
          },
        },
      },
      profile: {
        data: {
          type: 'profile',
          attributes: {
            email: 'test@example.com',
          },
        },
      },
      properties: {
        order_id: '12345',
        total: 99.99,
      },
      value: 99.99,
      time: '2024-01-01T12:00:00Z',
      unique_id: '12345',
    },
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.poll(polling, context);
  },

  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});