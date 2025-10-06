import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient } from '../common/client';
import { Event, EventList } from '../common/types';
import { createDropdownOptions } from '../common/index';

export const newBooking = createTrigger({
  auth: simplybookAuth,
  name: 'new_booking',
  displayName: 'New Booking',
  description: 'Triggers when a new booking is created',
  props: {
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only trigger for bookings created after this date/time',
      required: false,
    }),
    serviceFilter: Property.Dropdown({
      displayName: 'Service Filter',
      description: 'Only trigger for specific service (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.services(auth),
    }),
    providerFilter: Property.Dropdown({
      displayName: 'Provider Filter',
      description: 'Only trigger for specific provider (optional)',
      required: false,
      refreshers: [],
      options: async ({ auth }) => createDropdownOptions.providers(auth),
    }),
    pollInterval: Property.Number({
      displayName: 'Poll Interval (seconds)',
      description: 'How often to check for new bookings (minimum 60 seconds)',
      required: false,
      defaultValue: 300,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'booking_123',
    type: 'booking_created',
    object_id: 'booking_456',
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      booking: {
        id: 'booking_456',
        client_id: 'client_123',
        service_id: 'service_789',
        provider_id: 'provider_101',
        start_date_time: '2024-01-20T14:00:00Z',
        end_date_time: '2024-01-20T15:00:00Z',
        status: 'confirmed',
        notes: 'Regular appointment',
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
    const { serviceFilter, providerFilter } = context.propsValue;

    let since = await context.store?.get<string>('since');
    if (!since) {
      since =
        context.propsValue.since ||
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }

    const client = new SimplyBookClient({
      companyLogin,
      apiKey,
      baseUrl,
    });

    try {
      const eventList: EventList = await client.listEvents(since);

      let newBookingEvents = eventList.events.filter(
        (event: Event) => event.type === 'booking_created'
      );

      if (serviceFilter) {
        newBookingEvents = newBookingEvents.filter(
          (event: Event) => event.data['booking']?.service_id === serviceFilter
        );
      }

      if (providerFilter) {
        newBookingEvents = newBookingEvents.filter(
          (event: Event) =>
            event.data['booking']?.provider_id === providerFilter
        );
      }

      if (newBookingEvents.length > 0) {
        const latestTimestamp = Math.max(
          ...newBookingEvents.map((event: Event) =>
            new Date(event.timestamp).getTime()
          )
        );
        await context.store?.put(
          'since',
          new Date(latestTimestamp + 1).toISOString()
        );

        return newBookingEvents;
      }

      return [];
    } catch (error) {
      console.error('Error fetching new bookings:', error);
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

      const bookingEvents = eventList.events.filter(
        (event: Event) => event.type === 'booking_created'
      );

      return bookingEvents.slice(0, 5);
    } catch (error) {
      console.error('Error testing new booking trigger:', error);
      return [];
    }
  },
});
