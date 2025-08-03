import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const newCall = createTrigger({
  auth: zohoAuth,
  name: 'new-call',
  displayName: 'New Call',
  description: 'Fires when a call log is created in Bigin',
  props: {
    includeCallDetails: Property.Checkbox({
      displayName: 'Include Call Details',
      description: 'Include complete call information in the trigger payload',
      required: false,
      defaultValue: true,
    }),
    callTypeFilter: Property.StaticDropdown({
      displayName: 'Call Type Filter',
      description: 'Only trigger for specific call types (optional)',
      required: false,
      options: {
        options: [
          { label: 'Inbound', value: 'inbound' },
          { label: 'Outbound', value: 'outbound' },
          { label: 'Missed', value: 'missed' },
        ],
      },
    }),
    durationMin: Property.Number({
      displayName: 'Minimum Duration (seconds)',
      description: 'Only trigger for calls with minimum duration (optional)',
      required: false,
    }),
    durationMax: Property.Number({
      displayName: 'Maximum Duration (seconds)',
      description: 'Only trigger for calls with maximum duration (optional)',
      required: false,
    }),
  },
  type: 'webhook',
  sampleData: {
    call_id: '123456789',
    subject: 'Follow-up call with client',
    description: 'Discussed project requirements and timeline',
    call_type: 'outbound',
    duration: 300,
    phone_number: '+1234567890',
    contact_id: 'contact_123',
    company_id: 'company_456',
    deal_id: 'deal_789',
    call_date: '2024-01-15T10:30:00Z',
    created_by: 'user@company.com',
    created_at: '2024-01-15T10:30:00Z',
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for new calls
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/calls`;
    
    const webhookData = {
      event_type: 'call.created',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeCallDetails || true,
      filters: {
        call_type: propsValue.callTypeFilter,
        duration_min: propsValue.durationMin,
        duration_max: propsValue.durationMax,
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
    const endpoint = `${baseUrl}/webhooks/calls/${webhookData.webhook_id}`;

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
      call_id: payload.call_id,
      subject: payload.subject,
      description: payload.description,
      call_type: payload.call_type,
      duration: payload.duration,
      phone_number: payload.phone_number,
      contact_id: payload.contact_id,
      company_id: payload.company_id,
      deal_id: payload.deal_id,
      call_date: payload.call_date,
      created_by: payload.created_by,
      created_at: payload.created_at,
    };
  },
}); 