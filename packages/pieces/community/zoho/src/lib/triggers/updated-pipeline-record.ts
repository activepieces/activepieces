import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const updatedPipelineRecord = createTrigger({
  auth: zohoAuth,
  name: 'updated-pipeline-record',
  displayName: 'Updated Pipeline Record',
  description: 'Fires when a pipeline record is updated in Bigin',
  props: {
    includeDealDetails: Property.Checkbox({
      displayName: 'Include Deal Details',
      description: 'Include complete deal information in the trigger payload',
      required: false,
      defaultValue: true,
    }),
    includeChanges: Property.Checkbox({
      displayName: 'Include Changes',
      description: 'Include what fields were changed in the trigger payload',
      required: false,
      defaultValue: true,
    }),
    fieldFilter: Property.StaticDropdown({
      displayName: 'Field Filter',
      description: 'Only trigger when specific fields are updated (optional)',
      required: false,
      options: {
        options: [
          { label: 'Deal Name', value: 'deal_name' },
          { label: 'Amount', value: 'amount' },
          { label: 'Stage', value: 'stage' },
          { label: 'Close Date', value: 'close_date' },
          { label: 'Probability', value: 'probability' },
          { label: 'Next Step', value: 'next_step' },
          { label: 'Type', value: 'type' },
          { label: 'Any Field', value: 'any' },
        ],
      },
    }),
    stageFilter: Property.StaticDropdown({
      displayName: 'Stage Filter',
      description: 'Only trigger for deals in specific stages (optional)',
      required: false,
      options: {
        options: [
          { label: 'Qualification', value: 'qualification' },
          { label: 'Proposal', value: 'proposal' },
          { label: 'Negotiation', value: 'negotiation' },
          { label: 'Closed Won', value: 'closed_won' },
          { label: 'Closed Lost', value: 'closed_lost' },
        ],
      },
    }),
    dealTypeFilter: Property.StaticDropdown({
      displayName: 'Deal Type Filter',
      description: 'Only trigger for specific deal types (optional)',
      required: false,
      options: {
        options: [
          { label: 'New Business', value: 'new_business' },
          { label: 'Existing Business', value: 'existing_business' },
          { label: 'Renewal', value: 'renewal' },
          { label: 'Upsell', value: 'upsell' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    assignedToFilter: Property.ShortText({
      displayName: 'Assigned To Filter',
      description: 'Only trigger for deals assigned to specific user (optional)',
      required: false,
    }),
  },
  type: 'webhook',
  sampleData: {
    deal_id: 'deal_123456',
    deal_name: 'Enterprise Software License',
    amount: 50000,
    stage: 'negotiation',
    close_date: '2024-03-15T00:00:00Z',
    description: 'Annual software license renewal for enterprise client',
    contact_id: 'contact_123',
    company_id: 'company_456',
    assigned_to: 'user@company.com',
    lead_source: 'website',
    probability: 75,
    next_step: 'Final contract review',
    type: 'renewal',
    updated_by: 'user@company.com',
    updated_at: '2024-01-15T10:30:00Z',
    changes: {
      amount: {
        old_value: 45000,
        new_value: 50000,
      },
      probability: {
        old_value: 60,
        new_value: 75,
      },
      stage: {
        old_value: 'proposal',
        new_value: 'negotiation',
      },
    },
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for updated pipeline records
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/deals`;
    
    const webhookData = {
      event_type: 'deal.updated',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeDealDetails || true,
      include_changes: propsValue.includeChanges || true,
      filters: {
        field_filter: propsValue.fieldFilter,
        stage: propsValue.stageFilter,
        deal_type: propsValue.dealTypeFilter,
        assigned_to: propsValue.assignedToFilter,
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
    const endpoint = `${baseUrl}/webhooks/deals/${webhookData.webhook_id}`;

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
      deal_id: payload.deal_id,
      deal_name: payload.deal_name,
      amount: payload.amount,
      stage: payload.stage,
      close_date: payload.close_date,
      description: payload.description,
      contact_id: payload.contact_id,
      company_id: payload.company_id,
      assigned_to: payload.assigned_to,
      lead_source: payload.lead_source,
      probability: payload.probability,
      next_step: payload.next_step,
      type: payload.type,
      updated_by: payload.updated_by,
      updated_at: payload.updated_at,
      changes: payload.changes,
    };
  },
}); 