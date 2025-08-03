import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const createPipelineRecord = createAction({
  auth: zohoAuth,
  name: 'create-pipeline-record',
  displayName: 'Create Pipeline Record (Deal)',
  description: 'Add a new deal pipeline record in Bigin',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Name of the deal',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Deal Amount',
      description: 'Value of the deal',
      required: false,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Stage',
      description: 'Current stage of the deal',
      required: true,
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
    closeDate: Property.DateTime({
      displayName: 'Close Date',
      description: 'Expected close date of the deal',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description or notes about the deal',
      required: false,
    }),
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'ID of the contact related to this deal',
      required: false,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
      description: 'ID of the company related to this deal',
      required: false,
    }),
    assignedTo: Property.ShortText({
      displayName: 'Assigned To',
      description: 'User ID or email of the person assigned to this deal',
      required: false,
    }),
    leadSource: Property.StaticDropdown({
      displayName: 'Lead Source',
      description: 'Source of the lead',
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
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Probability of winning the deal (0-100)',
      required: false,
    }),
    nextStep: Property.ShortText({
      displayName: 'Next Step',
      description: 'Next action to take on this deal',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Deal Type',
      description: 'Type of deal',
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
  },
  run: async ({ auth, propsValue }) => {
    const {
      dealName,
      amount,
      stage,
      closeDate,
      description,
      contactId,
      companyId,
      assignedTo,
      leadSource,
      probability,
      nextStep,
      type,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/deals`;

    const dealData = {
      deal_name: dealName,
      amount,
      stage,
      close_date: closeDate,
      description,
      contact_id: contactId,
      company_id: companyId,
      assigned_to: assignedTo,
      lead_source: leadSource,
      probability,
      next_step: nextStep,
      type,
    };

    // Remove null/undefined values
    Object.keys(dealData).forEach(key => {
      if (dealData[key as keyof typeof dealData] === null || dealData[key as keyof typeof dealData] === undefined) {
        delete dealData[key as keyof typeof dealData];
      }
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dealData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create pipeline record: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return await response.json();
  },
}); 