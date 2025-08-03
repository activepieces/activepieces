import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const newPipelineRecord = createTrigger({
  auth: zohoAuth,
  name: 'new-pipeline-record',
  displayName: 'New Pipeline Record',
  description: 'Fires when a new deal/pipeline record is created in Bigin',
  props: {
    includeDealDetails: Property.Checkbox({
      displayName: 'Include Deal Details',
      description: 'Include complete deal information in the trigger payload',
      required: false,
      defaultValue: true,
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
    amountMin: Property.Number({
      displayName: 'Minimum Amount',
      description: 'Only trigger for deals with minimum amount (optional)',
      required: false,
    }),
    amountMax: Property.Number({
      displayName: 'Maximum Amount',
      description: 'Only trigger for deals with maximum amount (optional)',
      required: false,
    }),
    probabilityMin: Property.Number({
      displayName: 'Minimum Probability (%)',
      description: 'Only trigger for deals with minimum probability (0-100)',
      required: false,
    }),
    probabilityMax: Property.Number({
      displayName: 'Maximum Probability (%)',
      description: 'Only trigger for deals with maximum probability (0-100)',
      required: false,
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
    created_by: 'user@company.com',
    created_at: '2024-01-15T10:30:00Z',
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for new pipeline records
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/deals`;
    
    const webhookData = {
      event_type: 'deal.created',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeDealDetails || true,
      filters: {
        stage: propsValue.stageFilter,
        deal_type: propsValue.dealTypeFilter,
        amount_min: propsValue.amountMin,
        amount_max: propsValue.amountMax,
        probability_min: propsValue.probabilityMin,
        probability_max: propsValue.probabilityMax,
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
      created_by: payload.created_by,
      created_at: payload.created_at,
    };
  },
}); 