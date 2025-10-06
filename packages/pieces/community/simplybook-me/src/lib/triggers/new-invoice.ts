import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { simplybookAuth } from '../../index';
import { SimplyBookClient } from '../common/client';
import { Event, EventList } from '../common/types';

export const newInvoice = createTrigger({
  auth: simplybookAuth,
  name: 'new_invoice',
  displayName: 'New Invoice',
  description: 'Triggers when a new invoice is created',
  props: {
    since: Property.DateTime({
      displayName: 'Since',
      description: 'Only trigger for invoices created after this date/time',
      required: false,
    }),
    pollInterval: Property.Number({
      displayName: 'Poll Interval (seconds)',
      description: 'How often to check for new invoices (minimum 60 seconds)',
      required: false,
      defaultValue: 300,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'event_123',
    type: 'invoice_created',
    object_id: 'invoice_456',
    timestamp: '2024-01-15T10:30:00Z',
    data: {
      invoice: {
        id: 'invoice_456',
        booking_id: 'booking_123',
        amount: 150.00,
        status: 'pending',
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
      
      const newInvoiceEvents = eventList.events.filter(
        (event: Event) => event.type === 'invoice_created'
      );

      if (newInvoiceEvents.length > 0) {
        const latestTimestamp = Math.max(
          ...newInvoiceEvents.map((event: Event) => new Date(event.timestamp).getTime())
        );
        await context.store?.put('since', new Date(latestTimestamp + 1).toISOString());

        return newInvoiceEvents;
      }

      return [];
    } catch (error) {
      console.error('Error fetching new invoices:', error);
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

      const invoiceEvents = eventList.events.filter(
        (event: Event) => event.type === 'invoice_created'
      );

      return invoiceEvents.slice(0, 5);
    } catch (error) {
      console.error('Error testing new invoice trigger:', error);
      return [];
    }
  },
});