import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { wealthboxAuth } from '../common/auth';
import { WealthboxClient } from '../common/client';

export const newEvent = createTrigger({
  name: 'new_event',
  displayName: 'New Event',
  description: 'Triggers when a new event is created in Wealthbox CRM',
  auth: wealthboxAuth,
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of events to retrieve',
      required: false,
      defaultValue: 10,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 'event_123',
    title: 'Client Meeting',
    description: 'Quarterly review meeting with client',
    start_date: '2024-01-15T14:00:00Z',
    end_date: '2024-01-15T15:00:00Z',
    contact_id: 'contact_456',
    location: 'Conference Room A',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  onEnable: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    // Store the current timestamp to only get new events
    await context.store.put('lastEventCheck', new Date().toISOString());
  },
  onDisable: async (context) => {
    await context.store.delete('lastEventCheck');
  },
  run: async (context) => {
    const client = new WealthboxClient(context.auth as OAuth2PropertyValue);
    const lastCheck = await context.store.get<string>('lastEventCheck');
    const limit = context.propsValue.limit || 10;

    try {
      const response = await client.getEvents({ limit });
      const events = response.data;

      // Filter events created after the last check
      const newEvents = events.filter(event => {
        if (!lastCheck) return true;
        return new Date(event.created_at!) > new Date(lastCheck);
      });

      // Update the last check timestamp
      if (events.length > 0) {
        const latestEvent = events.reduce((latest, current) => 
          new Date(current.created_at!) > new Date(latest.created_at!) ? current : latest
        );
        await context.store.put('lastEventCheck', latestEvent.created_at);
      }

      return newEvents;
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  },
}); 