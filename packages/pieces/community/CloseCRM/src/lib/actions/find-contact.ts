import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { closeAuth } from "../../";
import { CloseCRMContact, CloseCRMSearchQuery } from "../common/types";

export const findContact = createAction({
  auth: closeAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for contacts by name, email, or other criteria with advanced filtering',
  props: {
    search_type: Property.StaticDropdown({
      displayName: 'Search Type',
      required: true,
      options: {
        options: [
          { label: 'By Name', value: 'name' },
          { label: 'By Email', value: 'email' },
          { label: 'By Phone', value: 'phone' },
          { label: 'By Lead ID', value: 'lead_id' },
          {label: 'By Contact ID', value: 'contact_id' },
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
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of contacts to return (1-100)',
      required: false,
      defaultValue: 10,
    }),
    include_fields: Property.StaticDropdown({
      displayName: 'Include Fields',
      description: 'Select which fields to include in the response',
      required: false,
      options:  {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Title', value: 'title' },
          { label: 'Lead ID', value: 'lead_id' },
          { label: 'Emails', value: 'emails' },
          { label: 'Phones', value: 'phones' },
          { label: 'URLs', value: 'urls' },
          { label: 'Date Created', value: 'date_created' },
          { label: 'Date Updated', value: 'date_updated' },
        ],
      },
    }),
  },
  async run(context) {
    const { search_type, search_query, match_type, limit, include_fields } = context.propsValue;

    try {
      // Build the search query
      const searchQuery = buildSearchQuery({
        search_type,
        search_query,
        match_type: match_type || 'contains',
        include_fields: Array.isArray(include_fields) 
        ? include_fields 
        : ['default', 'fields']
      });

      const response = await httpClient.sendRequest<{ data: CloseCRMContact[] }>({
        method: HttpMethod.GET,
        url: `https://api.close.com/api/v1/data/contact`,
        headers: {
          'Authorization': `bearer ${context.auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
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
      throw new Error(`Failed to search contacts: ${error.message}`);
    }
  },
});

// Helper function to build the search query
function buildSearchQuery(params: {
  search_type: string;
  search_query: string;
  match_type: string;
  include_fields: string[];
}): CloseCRMSearchQuery {
  const { search_type, search_query, match_type, include_fields } = params;

  const baseQuery = {
    type: "object_type",
    object_type: "contact"
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
          object_type: "contact",
          field_name: "name"
        },
        condition: {
          type: "text",
          mode: 'full_words',
          value: search_query
        }
      };
      break;

    case 'email':
      fieldCondition = {
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
      };
      break;

    case 'phone':
      fieldCondition = {
        type: "has_related",
        this_object_type: "contact",
        related_object_type: "contact_phone",
        related_query: {
          type: "field_condition",
          field: {
            type: "regular_field",
            object_type: "contact_phone",
            field_name: "phone"
          },
          condition: {
            type: "text",
            mode: 'phrase',
            value: search_query
          }
        }
      };
      break;

    case 'lead_id':
      fieldCondition = {
        type: "field_condition",
        field: {
          type: "regular_field",
          object_type: "contact",
          field_name: "lead_id"
        },
        condition: {
          type: "text",
          mode: 'phrase', // Always exact match for IDs
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
      contact: include_fields,
      lead: include_fields
    },

  };
}