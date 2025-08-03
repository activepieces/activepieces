import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const newEvent = createTrigger({
  auth: zohoAuth,
  name: 'new-event',
  displayName: 'New Event',
  description: 'Fires when an event is created in Bigin',
  props: {
    includeEventDetails: Property.Checkbox({
      displayName: 'Include Event Details',
      description: 'Include complete event information in the trigger payload',
      required: false,
      defaultValue: true,
    }),
    eventTypeFilter: Property.StaticDropdown({
      displayName: 'Event Type Filter',
      description: 'Only trigger for specific event types (optional)',
      required: false,
      options: {
        options: [
          { label: 'Meeting', value: 'meeting' },
          { label: 'Call', value: 'call' },
          { label: 'Demo', value: 'demo' },
          { label: 'Presentation', value: 'presentation' },
          { label: 'Follow-up', value: 'follow_up' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    startDateFilter: Property.DateTime({
      displayName: 'Start Date Filter',
      description: 'Only trigger for events starting after this date (optional)',
      required: false,
    }),
    endDateFilter: Property.DateTime({
      displayName: 'End Date Filter',
      description: 'Only trigger for events ending before this date (optional)',
      required: false,
    }),
    hasAttendees: Property.Checkbox({
      displayName: 'Has Attendees',
      description: 'Only trigger for events with attendees',
      required: false,
    }),
    locationFilter: Property.ShortText({
      displayName: 'Location Filter',
      description: 'Only trigger for events at specific locations (optional)',
      required: false,
    }),
  },
  type: 'webhook',
  sampleData: {
    event_id: 'event_123456',
    subject: 'Client Meeting - Q1 Review',
    description: 'Quarterly review meeting with key client',
    event_type: 'meeting',
    start_time: '2024-01-15T14:00:00Z',
    end_time: '2024-01-15T15:00:00Z',
    location: 'Conference Room A',
    attendees: [
      {
        email: 'john.doe@client.com',
        name: 'John Doe',
        response: 'accepted',
      },
      {
        email: 'jane.smith@company.com',
        name: 'Jane Smith',
        response: 'accepted',
      },
    ],
    contact_id: 'contact_123',
    company_id: 'company_456',
    deal_id: 'deal_789',
    created_by: 'user@company.com',
    created_at: '2024-01-15T10:30:00Z',
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for new events
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/events`;
    
    const webhookData = {
      event_type: 'event.created',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeEventDetails || true,
      filters: {
        event_type: propsValue.eventTypeFilter,
        start_date: propsValue.startDateFilter,
        end_date: propsValue.endDateFilter,
        has_attendees: propsValue.hasAttendees,
        location: propsValue.locationFilter,
      },
    };

    // Remove null/undefined values from filters
    Object.keys(webhookData.filters).forEach(key => {
      if (webhookData.filters[key as keyof typeof webhookData.filters] === null || 
          webhookData.filters[key as keyof typeof webhookData.filters] === undefined) {
        delete webhookData.filters[key as keyof typeof webhookData.filters];
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return {
      webhook_id: result.webhook_id,
      secret: result.secret,
    };
  },
  onDisable: async ({ auth, webhookData }) => {
    // Unregister webhook
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/events/${webhookData.webhook_id}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to unregister webhook: ${response.status} ${response.statusText} - ${errorText}`);
    }
  },
  run: async ({ payload, webhookData }) => {
    // Verify webhook signature if secret is provided
    if (webhookData.secret) {
      // Implement signature verification logic here if needed
    }

    return {
      event_id: payload.event_id,
      subject: payload.subject,
      description: payload.description,
      event_type: payload.event_type,
      start_time: payload.start_time,
      end_time: payload.end_time,
      location: payload.location,
      attendees: payload.attendees,
      contact_id: payload.contact_id,
      company_id: payload.company_id,
      deal_id: payload.deal_id,
      created_by: payload.created_by,
      created_at: payload.created_at,
    };
  },
}); 