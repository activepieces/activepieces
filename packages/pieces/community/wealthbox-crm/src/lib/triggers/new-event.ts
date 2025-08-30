import { TriggerStrategy, createTrigger, Property } from '@activepieces/pieces-framework';
import { wealthboxCrmAuth } from '../../';
import { makeClient } from '../common';

export const newEventTrigger = createTrigger({
  auth: wealthboxCrmAuth,
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a new event is created',
  type: TriggerStrategy.POLLING,
  props: {
    polling_interval: Property.Number({
      displayName: 'Polling Interval (seconds)',
      required: false,
      defaultValue: 60,
      description: 'How often to check for new events (minimum 60 seconds)',
    }),
  },
  async onEnable(context) {
    await context.store.put('last_event_id', 0);
  },
  async run(context) {
    const { polling_interval = 60 } = context.propsValue;
    const lastEventId = await context.store.get('last_event_id') || 0;
    
    const client = makeClient(context.auth);
    const events = await client.listEvents();
    
    const newEvents = events.events.filter((event: any) => event.id > lastEventId);
    
    if (newEvents.length > 0) {
      const maxEventId = Math.max(...newEvents.map((event: any) => event.id));
      await context.store.put('last_event_id', maxEventId);
    }
    
    return newEvents;
  },
  sampleData: {
    id: 1,
    type: 'Event',
    subject: 'Client Meeting',
    description: 'Quarterly review meeting',
    start_date: '2024-01-15T10:00:00Z',
    end_date: '2024-01-15T11:00:00Z',
    contact_id: 123,
    location: 'Conference Room A',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
});
