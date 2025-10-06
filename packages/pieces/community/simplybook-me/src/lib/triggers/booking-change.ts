import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient } from '../common/client';
import { Event, EventList } from '../common/types';

export const bookingChange = createTrigger({
  auth: simplybookAuth,
  name: 'booking_change',
  displayName: 'Booking Changed',
  description: 'Triggers when a booking is modified or updated',
  props: {
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only trigger for bookings changed after this date/time',
      required: false,
    }),
    pollInterval: Property.Number({
      displayName: 'Poll Interval (seconds)',
      description: 'How often to check for booking changes (minimum 60 seconds)',
      required: false,
      defaultValue: 300, // 5 minutes
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'event_123',
    type: 'booking_updated',
    object_id: 'booking_456',
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      booking: {
        id: 'booking_456',
        client_id: 'client_123',
        service_id: 'service_789',
        provider_id: 'provider_101',
        start_date_time: '2024-01-20T15:00:00Z', // Changed time
        end_date_time: '2024-01-20T16:00:00Z',
        status: 'confirmed',
        notes: 'Rescheduled appointment',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-01-15T10:30:00Z',
      },
      changes: {
        start_date_time: {
          old: '2024-01-20T14:00:00Z',
          new: '2024-01-20T15:00:00Z',
        },
        end_date_time: {
          old: '2024-01-20T15:00:00Z',
          new: '2024-01-20T16:00:00Z',
        },
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
      
      // Filter for booking update events
      const bookingChangeEvents = eventList.events.filter(
        (event: Event) => event.type === 'booking_updated'
      );

      if (bookingChangeEvents.length > 0) {
        const latestTimestamp = Math.max(
          ...bookingChangeEvents.map((event: Event) => new Date(event.timestamp).getTime())
        );
        await context.store?.put('since', new Date(latestTimestamp + 1).toISOString());

        return bookingChangeEvents;
      }

      return [];
    } catch (error) {
      console.error('Error fetching booking changes:', error);
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

      const changeEvents = eventList.events.filter(
        (event: Event) => event.type === 'booking_updated'
      );

      return changeEvents.slice(0, 5);
    } catch (error) {
      console.error('Error testing booking change trigger:', error);
      return [];
    }
  },
});