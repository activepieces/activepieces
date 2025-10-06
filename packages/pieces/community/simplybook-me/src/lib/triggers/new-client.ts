import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient } from '../common/client';
import { Event, EventList } from '../common/types';

export const newClient = createTrigger({
  auth: simplybookAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Triggers when a new client is created',
  props: {
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only trigger for clients created after this date/time',
      required: false,
    }),
    pollInterval: Property.Number({
      displayName: 'Poll Interval (seconds)',
      description: 'How often to check for new clients (minimum 60 seconds)',
      required: false,
      defaultValue: 300,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'event_123',
    type: 'client_created',
    object_id: 'client_456',
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      client: {
        id: 'client_456',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      },
    },
  },
  onEnable: async (context) => {
    const since = context.propsValue.since || new Date().toISOString();
    await context.store?.put('since', since);
  },
  onDisable: async (context) => {
    await context.store?.delete('since');
  },
  run: async (context) => {
    const { companyLogin, apiKey, baseUrl } = context.auth;

    let since = await context.store?.get<string>('since');
    if (!since) {
      since = context.propsValue.since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const eventList: EventList = await client.listEvents(since);
      
      const newClientEvents = eventList.events.filter(
        (event: Event) => event.type === 'client_created'
      );

      if (newClientEvents.length > 0) {
        const latestTimestamp = Math.max(
          ...newClientEvents.map((event: Event) => new Date(event.timestamp).getTime())
        );
        await context.store?.put('since', new Date(latestTimestamp + 1).toISOString());

        return newClientEvents;
      }

      return [];
    } catch (error) {
      console.error('Error fetching new clients:', error);
      return [];
    }
  },
  test: async (context) => {
    const { companyLogin, apiKey, baseUrl } = context.auth;

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const eventList: EventList = await client.listEvents(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

      const clientEvents = eventList.events.filter(
        (event: Event) => event.type === 'client_created'
      );

      return clientEvents.slice(0, 5);
    } catch (error) {
      console.error('Error testing new client trigger:', error);
      return [];
    }
  },
});