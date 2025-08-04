import { zohoAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';

export const searchPipelineRecord = createAction({
  auth: zohoAuth,
  name: 'search-pipeline-record',
  displayName: 'Search Pipeline Record',
  description: 'Retrieve deals by deal name in Bigin',
  props: {
    dealName: Property.ShortText({
      displayName: 'Deal Name',
      description: 'Name of the deal to search for',
      required: true,
    }),
    stage: Property.StaticDropdown({
      displayName: 'Stage Filter',
      description: 'Filter deals by stage (optional)',
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
    amountMin: Property.Number({
      displayName: 'Minimum Amount',
      description: 'Minimum deal amount to filter by (optional)',
      required: false,
    }),
    amountMax: Property.Number({
      displayName: 'Maximum Amount',
      description: 'Maximum deal amount to filter by (optional)',
      required: false,
    }),
    closeDateFrom: Property.DateTime({
      displayName: 'Close Date From',
      description: 'Filter deals by close date from (optional)',
      required: false,
    }),
    closeDateTo: Property.DateTime({
      displayName: 'Close Date To',
      description: 'Filter deals by close date to (optional)',
      required: false,
    }),
    assignedTo: Property.ShortText({
      displayName: 'Assigned To',
      description: 'Filter deals by assigned user (optional)',
      required: false,
    }),
    dealType: Property.StaticDropdown({
      displayName: 'Deal Type Filter',
      description: 'Filter deals by type (optional)',
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
    probabilityMin: Property.Number({
      displayName: 'Minimum Probability (%)',
      description: 'Minimum probability to filter by (0-100)',
      required: false,
    }),
    probabilityMax: Property.Number({
      displayName: 'Maximum Probability (%)',
      description: 'Maximum probability to filter by (0-100)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50)',
      required: false,
      defaultValue: 50,
    }),
    includeDetails: Property.Checkbox({
      displayName: 'Include Full Details',
      description: 'Include complete deal information in results',
      required: false,
    }),
  },
  run: async ({ auth, propsValue }) => {
    const {
      dealName,
      stage,
      amountMin,
      amountMax,
      closeDateFrom,
      closeDateTo,
      assignedTo,
      dealType,
      probabilityMin,
      probabilityMax,
      limit,
      includeDetails,
    } = propsValue;

    // Construct the API endpoint
    const baseUrl = auth.data?.['api_domain'] ? `${auth.data['api_domain']}/bigin/v2` : '';
    const endpoint = `${baseUrl}/deals/search`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('deal_name', dealName);
    
    if (stage) {
      queryParams.append('stage', stage);
    }
    
    if (amountMin) {
      queryParams.append('amount_min', amountMin.toString());
    }
    
    if (amountMax) {
      queryParams.append('amount_max', amountMax.toString());
    }
    
    if (closeDateFrom) {
      queryParams.append('close_date_from', closeDateFrom);
    }
    
    if (closeDateTo) {
      queryParams.append('close_date_to', closeDateTo);
    }
    
    if (assignedTo) {
      queryParams.append('assigned_to', assignedTo);
    }
    
    if (dealType) {
      queryParams.append('deal_type', dealType);
    }
    
    if (probabilityMin) {
      queryParams.append('probability_min', probabilityMin.toString());
    }
    
    if (probabilityMax) {
      queryParams.append('probability_max', probabilityMax.toString());
    }
    
    if (limit) {
      queryParams.append('limit', limit.toString());
    }
    
    if (includeDetails) {
      queryParams.append('include_details', 'true');
    }

    const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to search pipeline records: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    
    return {
      deals: result.data || result,
      total_count: result.total_count || result.length,
      deal_name: dealName,
      search_filters: {
        stage,
        amount_min: amountMin,
        amount_max: amountMax,
        close_date_from: closeDateFrom,
        close_date_to: closeDateTo,
        assigned_to: assignedTo,
        deal_type: dealType,
        probability_min: probabilityMin,
        probability_max: probabilityMax,
      },
    };
  },
}); 