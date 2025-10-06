import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient } from '../common/client';
import { Event, EventList } from '../common/types';

export const newOffer = createTrigger({
  auth: simplybookAuth,
  name: 'new_offer',
  displayName: 'New Offer',
  description: 'Triggers when a new offer is created',
  props: {
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only trigger for offers created after this date/time',
      required: false,
    }),
    pollInterval: Property.Number({
      displayName: 'Poll Interval (seconds)',
      description: 'How often to check for new offers (minimum 60 seconds)',
      required: false,
      defaultValue: 300,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'event_123',
    type: 'offer_created',
    object_id: 'offer_456',
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      offer: {
        id: 'offer_456',
        title: 'Special Discount',
        description: '20% off all services',
        discount_percentage: 20,
        valid_from: '2024-01-15T00:00:00Z',
        valid_until: '2024-01-31T23:59:59Z',
        created_at: '2024-01-15T10:30:00Z',
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
      
      const newOfferEvents = eventList.events.filter(
        (event: Event) => event.type === 'offer_created'
      );

      if (newOfferEvents.length > 0) {
        const latestTimestamp = Math.max(
          ...newOfferEvents.map((event: Event) => new Date(event.timestamp).getTime())
        );
        await context.store?.put('since', new Date(latestTimestamp + 1).toISOString());

        return newOfferEvents;
      }

      return [];
    } catch (error) {
      console.error('Error fetching new offers:', error);
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

      const offerEvents = eventList.events.filter(
        (event: Event) => event.type === 'offer_created'
      );

      return offerEvents.slice(0, 5);
    } catch (error) {
      console.error('Error testing new offer trigger:', error);
      return [];
    }
  },
});