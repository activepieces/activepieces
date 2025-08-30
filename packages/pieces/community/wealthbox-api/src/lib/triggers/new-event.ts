import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newEvent = createTrigger({
  name: 'new_event',
  displayName: 'New Event',
  description: 'Fires when a new event is created',
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Filter events by resource type',
      required: false,
      options: {
        options: [
          { label: 'Contact', value: 'Contact' },
          { label: 'Household', value: 'Household' },
          { label: 'Project', value: 'Project' },
          { label: 'Opportunity', value: 'Opportunity' }
        ]
      }
    }),
    start_date_min: Property.DateTime({
      displayName: 'Start Date Minimum',
      description: 'Only include events starting on or after this date',
      required: false
    }),
    start_date_max: Property.DateTime({
      displayName: 'Start Date Maximum',
      description: 'Only include events starting on or before this date',
      required: false
    }),
    event_category: Property.Number({
      displayName: 'Event Category ID',
      description: 'Filter events by category ID',
      required: false
    })
  },
  sampleData: {
    id: 1,
    creator: 1,
    created_at: '2015-05-24 10:00 AM -0400',
    updated_at: '2015-10-12 11:30 PM -0400',
    title: 'Client Meeting',
    starts_at: '2015-05-24 10:00 AM -0400',
    ends_at: '2015-05-24 11:00 AM -0400',
    repeats: true,
    event_category: 2,
    all_day: true,
    location: 'Conference Room',
    description: 'Review meeting for Kevin...',
    state: 'confirmed',
    visible_to: 'Everyone',
    email_invitees: true,
    linked_to: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    invitees: [
      {
        id: 1,
        type: 'Contact',
        name: 'Kevin Anderson'
      }
    ],
    custom_fields: [
      {
        id: 1,
        name: 'My Field',
        value: '123456789',
        document_type: 'Contact',
        field_type: 'single_select'
      }
    ]
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    // Store the current timestamp to track new events from this point forward
    await context.store?.put(
      '_new_event_last_created_at',
      new Date().toISOString()
    );
  },
  async onDisable(context) {
    await context.store?.delete('_new_event_last_created_at');
  },
  async run(context) {
    const { resource_type, start_date_min, start_date_max, event_category } =
      context.propsValue;

    // Check for authentication
    if (!context.auth) {
      throw new Error('API access token is required');
    }

    // Get the last check timestamp
    const lastCreatedAt = await context.store?.get(
      '_new_event_last_created_at'
    );
    const currentTime = new Date().toISOString();

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (resource_type) {
        params.append('resource_type', resource_type);
      }

      if (start_date_min) {
        params.append('start_date_min', new Date(start_date_min).toISOString());
      }

      if (start_date_max) {
        params.append('start_date_max', new Date(start_date_max).toISOString());
      }

      // Use created order to get newest events first
      params.append('order', 'created');

      // If we have a last check time, only get events created since then
      if (lastCreatedAt && typeof lastCreatedAt === 'string') {
        params.append('updated_since', lastCreatedAt);
      }

      const queryString = params.toString();
      const url = `https://api.crmworkspace.com/v1/events${
        queryString ? `?${queryString}` : ''
      }`;

      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url,
        headers: {
          'ACCESS_TOKEN': context.auth as string,
          'Content-Type': 'application/json'
        }
      });

      if (response.status !== 200) {
        throw new Error(
          `Failed to fetch events: ${response.status} ${response.body}`
        );
      }

      const events = response.body?.events || [];

      // Filter events by category if specified
      let filteredEvents = events;
      if (event_category) {
        filteredEvents = events.filter(
          (event: any) => event.event_category === event_category
        );
      }

      // Filter for truly new events (created since last check)
      const newEvents =
        lastCreatedAt && typeof lastCreatedAt === 'string'
          ? filteredEvents.filter((event: any) => {
              const eventCreatedAt = new Date(event.created_at);
              const lastCheck = new Date(lastCreatedAt);
              return eventCreatedAt > lastCheck;
            })
          : filteredEvents.slice(0, 10); // Limit initial fetch to prevent overwhelming

      // Update the last check timestamp
      await context.store?.put('_new_event_last_created_at', currentTime);

      return newEvents;
    } catch (error) {
      console.error('Error fetching new events:', error);
      throw error;
    }
  }
});
