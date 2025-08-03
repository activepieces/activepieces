import { zohoAuth } from '../../index';
import { Property, createTrigger } from '@activepieces/pieces-framework';

export const updatedContact = createTrigger({
  auth: zohoAuth,
  name: 'updated-contact',
  displayName: 'Updated Contact',
  description: 'Fires when an existing contact is updated in Bigin',
  props: {
    includeContactDetails: Property.Checkbox({
      displayName: 'Include Contact Details',
      description: 'Include complete contact information in the trigger payload',
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
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Company', value: 'company' },
          { label: 'Job Title', value: 'job_title' },
          { label: 'Lead Source', value: 'lead_source' },
          { label: 'Address', value: 'address' },
          { label: 'Any Field', value: 'any' },
        ],
      },
    }),
    leadSourceFilter: Property.StaticDropdown({
      displayName: 'Lead Source Filter',
      description: 'Only trigger for contacts from specific lead sources (optional)',
      required: false,
      options: {
        options: [
          { label: 'Website', value: 'website' },
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'Referral', value: 'referral' },
          { label: 'Social Media', value: 'social_media' },
          { label: 'Advertisement', value: 'advertisement' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    companyFilter: Property.ShortText({
      displayName: 'Company Filter',
      description: 'Only trigger for contacts from specific companies (optional)',
      required: false,
    }),
  },
  type: 'webhook',
  sampleData: {
    contact_id: 'contact_123456',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    company: 'Acme Corporation',
    job_title: 'Sales Manager',
    lead_source: 'website',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      country: 'USA',
    },
    updated_by: 'user@company.com',
    updated_at: '2024-01-15T10:30:00Z',
    changes: {
      email: {
        old_value: 'john.doe@oldcompany.com',
        new_value: 'john.doe@example.com',
      },
      job_title: {
        old_value: 'Sales Representative',
        new_value: 'Sales Manager',
      },
    },
  },
  onEnable: async ({ auth, propsValue }) => {
    // Register webhook for updated contacts
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/webhooks/contacts`;
    
    const webhookData = {
      event_type: 'contact.updated',
      callback_url: '{{webhookUrl}}',
      include_details: propsValue.includeContactDetails || true,
      include_changes: propsValue.includeChanges || true,
      filters: {
        field_filter: propsValue.fieldFilter,
        lead_source: propsValue.leadSourceFilter,
        company: propsValue.companyFilter,
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
    const endpoint = `${baseUrl}/webhooks/contacts/${webhookData.webhook_id}`;

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
      contact_id: payload.contact_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      job_title: payload.job_title,
      lead_source: payload.lead_source,
      address: payload.address,
      updated_by: payload.updated_by,
      updated_at: payload.updated_at,
      changes: payload.changes,
    };
  },
}); 