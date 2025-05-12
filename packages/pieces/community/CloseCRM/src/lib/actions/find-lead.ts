import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { closeAuth } from "../../";
import { CloseCRMLead, CloseCRMSearchQuery } from "../common/types";

export const findLead = createAction({
  auth: closeAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Search for leads with advanced filtering options',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      required: true,
      options: {
        options: [
          { label: 'By Name', value: 'name' },
          { label: 'By Contact Email', value: 'contact_email' },
          { label: 'By Status', value: 'status' },
          { label: 'By Custom Field', value: 'custom_field' },
        ],
      },
    }),
    search_query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
    }),
    match_type: Property.StaticDropdown({
      displayName: 'Match Type',
      required: false,
      options: {
        options: [
          { label: 'Contains', value: 'contains' },
          { label: 'Exact Match', value: 'exact' },
          { label: 'Starts With', value: 'starts' },
          { label: 'Ends With', value: 'ends' },
        ],
      },
      defaultValue: 'contains',
    }),
    custom_field_name: Property.ShortText({
      displayName: 'Custom Field Name',
      description: 'Required when searching by custom field',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of leads to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
    include_fields: Property.StaticDropdown({
      displayName: 'Include Fields',
      description: 'Select which fields to include in the response',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Name', value: 'name' },
          { label: 'Display Name', value: 'display_name' },
          { label: 'Status', value: 'status_label' },
          { label: 'URL', value: 'url' },
          { label: 'Contacts', value: 'contacts' },
          { label: 'Date Created', value: 'date_created' },
          { label: 'Date Updated', value: 'date_updated' },
          { label: 'Custom Fields', value: 'custom_fields' },
        ],
      },
      defaultValue: ['id', 'name', 'status_label', 'contacts'],
    }),
  },
  async run(context) {
    const { 
      search_type, 
      search_query, 
      match_type, 
      custom_field_name,
      limit, 
      include_fields 
    } = context.propsValue;

    // Validate custom field search
    if (search_type === 'custom_field' && !custom_field_name) {
      throw new Error('Custom field name is required when searching by custom field');
    }

    try {
      // Build the search query
      const searchQuery = buildLeadSearchQuery({
        search_type,
        search_query,
        match_type: match_type || 'contains',
        custom_field_name
      });

      const response = await httpClient.sendRequest<{ data: CloseCRMLead[] }>({
        method: HttpMethod.GET,
        url: `https://api.close.com/api/v1/data/lead`,
        headers: {
          'Authorization': `Bearer ${context.auth}`,
          'Content-Type': 'application/json',
        },
        queryParams: {
          ...(limit && { '_limit': limit.toString() }),
        },
        body: searchQuery,
      });

      return response.body.data || [];
    } catch (error:any) {
      if (error.response?.status === 400) {
        throw new Error(`Invalid search query: ${error.response.body?.error || 'Unknown error'}`);
      }
      if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      if (error.response?.status === 404) {
        throw new Error('No leads found matching your criteria.');
      }
      throw new Error(`Failed to search leads: ${error.message}`);
    }
  },
});

// Helper function to build the lead search query
function buildLeadSearchQuery(params: {
  search_type: string;
  search_query: string;
  match_type: string;
  custom_field_name?: string;
 
}): CloseCRMSearchQuery {
  const { search_type, search_query, match_type, custom_field_name } = params;

  const baseQuery = {
    type: "object_type",
    object_type: "lead"
  };

  let fieldCondition;
  const modeMap = {
    'contains': 'full_words',
    'exact': 'phrase',
    'starts': 'starts_with',
    'ends': 'ends_with'
  };

  switch (search_type) {
    case 'name':
      fieldCondition = {
        type: "field_condition",
        field: {
          type: "regular_field",
          object_type: "lead",
          field_name: "name"
        },
        condition: {
          type: "text",
          mode: 'full_words',
          value: search_query
        }
      };
      break;

    case 'contact_email':
      fieldCondition = {
        type: "has_related",
        this_object_type: "lead",
        related_object_type: "contact",
        related_query: {
          type: "has_related",
          this_object_type: "contact",
          related_object_type: "contact_email",
          related_query: {
            type: "field_condition",
            field: {
              type: "regular_field",
              object_type: "contact_email",
              field_name: "email"
            },
            condition: {
              type: "text",
              mode: 'phrase',
              value: search_query
            }
          }
        }
      };
      break;

    case 'status':
      fieldCondition = {
        type: "field_condition",
        field: {
          type: "regular_field",
          object_type: "lead",
          field_name: "status_label"
        },
        condition: {
          type: "text",
          mode: 'phrase',
          value: search_query
        }
      };
      break;

    case 'custom_field':
      fieldCondition = {
        type: "field_condition",
        field: {
          type: "regular_field",
          object_type: "lead",
          field_name: custom_field_name!
        },
        condition: {
          type: "text",
          mode: 'full_words',
          value: search_query
        }
      };
      break;

    default:
      throw new Error(`Unsupported search type: ${search_type}`);
  }

  return {
    query: {
      type: "and",
      queries: [baseQuery, fieldCondition]
    },
    _fields: {
      lead:  ['id', 'name', 'status_label', 'contacts'],
      contact: ['id', 'name', 'emails', 'phones']
    }
  };
}