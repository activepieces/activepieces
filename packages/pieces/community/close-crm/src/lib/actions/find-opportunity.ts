import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams, httpClient } from "@activepieces/pieces-common";
import { CLOSE_API_URL } from "../common/constants";
import { closeCrmAuth } from "../../index";

export const findOpportunity = createAction({
  auth: closeCrmAuth,
  name: 'find_opportunity',
  displayName: 'Find Opportunity',
  description: 'Locate opportunities by status or lead ID.',
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search for an opportunity.',
      required: true,
      options: {
        options: [
          { label: 'Status ID', value: 'status_id' },
          { label: 'Status Label', value: 'status_label' },
          { label: 'Lead ID', value: 'lead_id' },
        ],
      },
    }),
    search_value: Property.ShortText({
      displayName: 'Search Value',
      description: 'The ID or label to search for.',
      required: true,
    }),
    status_type: Property.StaticDropdown({
        displayName: 'Status Type (if searching by Status Label)',
        description: 'Filter by status type when searching by label (e.g., active, won, lost).',
        required: false,
        options: {
            options: [
                { label: 'Any', value: '' },
                { label: 'Active', value: 'active' },
                { label: 'Won', value: 'won' },
                { label: 'Lost', value: 'lost' },
            ]
        }
    })
  },
  async run(context) {
    const { search_by, search_value, status_type } = context.propsValue;
    const api_key = context.auth.username;

    const queryParams: QueryParams = {
        _fields: 'id,lead_id,lead_name,status_id,status_label,status_type,pipeline_id,pipeline_name,user_id,user_name,contact_id,value,value_period,value_formatted,expected_value,annualized_value,annualized_expected_value,confidence,note,date_created,date_updated,date_won'
    };

    if (search_by === 'status_id') {
      queryParams['status_id'] = search_value;
    } else if (search_by === 'status_label') {
      queryParams['status_label'] = search_value;
      if (status_type) {
        queryParams['status_type'] = status_type;
      }
    } else if (search_by === 'lead_id') {
      queryParams['lead_id'] = search_value;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${CLOSE_API_URL}/opportunity/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${api_key}:`).toString('base64'),
        'Accept': 'application/json',
      },
      queryParams: queryParams,
    });

    return response.body.data || [];
  },
});
