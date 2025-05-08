import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { closeAuth } from "../../";
import { CloseCRMOpportunity } from "../common/types";

export const findOpportunity = createAction({
  auth: closeAuth,
  name: 'find_opportunity',
  displayName: 'Find Opportunity',
  description: 'Search for opportunities with advanced filtering options',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      required: true,
      options: {
        options: [
          { label: 'By Status', value: 'status' },
          { label: 'By Lead', value: 'lead' },
          { label: 'By User', value: 'user' },
          { label: 'By Contact', value: 'contact' },
          { label: 'By Value Range', value: 'value' },
          { label: 'By Date Range', value: 'date' },
        ],
      },
    }),
    status_id: Property.ShortText({
      displayName: 'Status ID',
      description: 'The exact status ID to filter by',
      required: false,
    }),
    status_label: Property.ShortText({
      displayName: 'Status Label',
      description: 'The status label to filter by',
      required: false,
    }),
    status_type: Property.StaticDropdown({
      displayName: 'Status Type',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Won', value: 'won' },
          { label: 'Lost', value: 'lost' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The lead ID to filter by',
      required: false,
    }),
    user_id: Property.ShortText({
      displayName: 'User ID',
      description: 'The user ID to filter by',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The contact ID to filter by',
      required: false,
    }),
    min_value: Property.Number({
      displayName: 'Minimum Value',
      description: 'Minimum opportunity value (in cents)',
      required: false,
    }),
    max_value: Property.Number({
      displayName: 'Maximum Value',
      description: 'Maximum opportunity value (in cents)',
      required: false,
    }),
    date_created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Find opportunities created after this date',
      required: false,
    }),
    date_created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Find opportunities created before this date',
      required: false,
    }),
    include_fields: Property.StaticDropdown({
      displayName: 'Include Fields',
      description: 'Select which fields to include in the response',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Lead Info', value: 'lead_id,lead_name' },
          { label: 'Status Info', value: 'status_id,status_label,status_type' },
          { label: 'Pipeline Info', value: 'pipeline_id,pipeline_name' },
          { label: 'User Info', value: 'user_id,user_name' },
          { label: 'Contact Info', value: 'contact_id' },
          { label: 'Value Info', value: 'value,value_period,value_formatted' },
          { label: 'Projected Value', value: 'expected_value' },
          { label: 'Annualized Value', value: 'annualized_value,annualized_expected_value' },
          { label: 'Confidence', value: 'confidence' },
          { label: 'Notes', value: 'note' },
          { label: 'Dates', value: 'date_created,date_updated,date_won' },
        ],
      },
      defaultValue: ['id', 'lead_id,lead_name', 'status_id,status_label,status_type', 'value,value_period,value_formatted'],
    }),
    limit: Property.Number({
      displayName: 'Result Limit',
      description: 'Maximum number of opportunities to return (1-100)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const {
      search_type,
      status_id,
      status_label,
      status_type,
      lead_id,
      user_id,
      contact_id,
      min_value,
      max_value,
      date_created_after,
      date_created_before,
      include_fields,
      limit,
    } = context.propsValue;
    const { apiKey, environment } = context.auth;

    // Validate search parameters
    if (search_type === 'status' && !status_id && !status_label && !status_type) {
      throw new Error('At least one status filter (ID, label, or type) is required when searching by status');
    }

    if (search_type === 'lead' && !lead_id) {
      throw new Error('Lead ID is required when searching by lead');
    }

    // Build query parameters
    const queryParams: Record<string, string> = {
      _fields: 'id,lead_id,status_id,value',
      ...(limit && { _limit: limit.toString() }),
    };

    // Add filters based on search type
    switch (search_type) {
      case 'status':
        if (status_id) queryParams['status_id'] = status_id;
        if (status_label) queryParams['status_label'] = status_label;
        if (status_type) queryParams['status_type'] = status_type;
        break;
      case 'lead':
        if (lead_id) queryParams['lead_id'] = lead_id;
        break;
      case 'user':
        if (user_id) queryParams['user_id'] = user_id;
        break;
      case 'contact':
        if (contact_id) queryParams['contact_id'] = contact_id;
        break;
      case 'value':
        if (min_value) queryParams['value__gte'] = min_value.toString();
        if (max_value) queryParams['value__lte'] = max_value.toString();
        break;
      case 'date':
        if (date_created_after) queryParams['date_created__gte'] = date_created_after;
        if (date_created_before) queryParams['date_created__lte'] = date_created_before;
        break;
    }

    try {
      const response = await httpClient.sendRequest<{ data: CloseCRMOpportunity[] }>({
        method: HttpMethod.GET,
        url: `${environment === 'sandbox' ? 'https://api-sandbox.close.com/api/v1' : 'https://api.close.com/api/v1'}/opportunity/`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Accept': 'application/json',
        },
        queryParams: queryParams,
      });

      return response.body.data || [];
    } catch (error:any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid search parameters: ${error.response.body?.error || 'Unknown error'}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      throw new Error(`Failed to search opportunities: ${error.message}`);
    }
  },
});