import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const updatedCompany = createTrigger({
  auth: zohoAuth,
  name: 'updated-company',
  displayName: 'Updated Company',
  description: 'Fires when a company record is updated in Bigin',
  props: {
    includeCompanyDetails: Property.Checkbox({
      displayName: 'Include Company Details',
      description: 'Include complete company information in the trigger payload',
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
          { label: 'Name', value: 'name' },
          { label: 'Industry', value: 'industry' },
          { label: 'Company Type', value: 'company_type' },
          { label: 'Website', value: 'website' },
          { label: 'Annual Revenue', value: 'annual_revenue' },
          { label: 'Address', value: 'address' },
          { label: 'Phone', value: 'phone' },
          { label: 'Email', value: 'email' },
          { label: 'Any Field', value: 'any' },
        ],
      },
    }),
    companyTypeFilter: Property.StaticDropdown({
      displayName: 'Company Type Filter',
      description: 'Only trigger for specific company types (optional)',
      required: false,
      options: {
        options: [
          { label: 'Customer', value: 'customer' },
          { label: 'Prospect', value: 'prospect' },
          { label: 'Partner', value: 'partner' },
          { label: 'Vendor', value: 'vendor' },
          { label: 'Competitor', value: 'competitor' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    industryFilter: Property.ShortText({
      displayName: 'Industry Filter',
      description: 'Only trigger for companies in specific industries (optional)',
      required: false,
    }),
  },
  type: 'webhook',
  sampleData: {
    company_id: 'company_123456',
    name: 'Acme Corporation',
    industry: 'Technology',
    company_type: 'customer',
    website: 'https://www.acme.com',
    annual_revenue: 5000000,
    address: {
      street: '123 Business Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'USA',
    },
    phone: '+1-555-123-4567',
    email: 'info@acme.com',
    employee_count: 250,
    updated_by: 'user@company.com',
    updated_at: '2024-01-15T10:30:00Z',
    changes: {
      annual_revenue: {
        old_value: 3000000,
        new_value: 5000000,
      },
      industry: {
        old_value: 'Software',
        new_value: 'Technology',
      },
    },
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for updated companies
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/companies`;
    
    const webhookData = {
      event_type: 'company.updated',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeCompanyDetails || true,
      include_changes: propsValue.includeChanges || true,
      filters: {
        field_filter: propsValue.fieldFilter,
        company_type: propsValue.companyTypeFilter,
        industry: propsValue.industryFilter,
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
    const endpoint = `${baseUrl}/webhooks/companies/${webhookData.webhook_id}`;

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
      company_id: payload.company_id,
      name: payload.name,
      industry: payload.industry,
      company_type: payload.company_type,
      website: payload.website,
      annual_revenue: payload.annual_revenue,
      address: payload.address,
      phone: payload.phone,
      email: payload.email,
      employee_count: payload.employee_count,
      updated_by: payload.updated_by,
      updated_at: payload.updated_at,
      changes: payload.changes,
    };
  },
}); 