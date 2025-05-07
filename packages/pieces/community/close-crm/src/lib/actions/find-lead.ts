import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { CLOSE_API_URL } from "../common/constants";
import { closeCrmAuth } from "../../index";

export const findLead = createAction({
  auth: closeCrmAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: 'Search for leads by name or contact email.',
  props: {
    search_field: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Field to search on.',
      required: true,
      options: {
        options: [
          { label: 'Lead Name', value: 'lead_name' },
          { label: 'Contact Email', value: 'contact_email' },
        ],
      },
    }),
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The name or email to search for.',
      required: true,
    }),
    lead_name_match_type: Property.StaticDropdown({
      displayName: 'Lead Name Match Type',
      description: 'How to match the lead name.',
      required: false,
      defaultValue: 'full_words',
      options: {
        options: [
          { label: 'Full Words (Flexible)', value: 'full_words' },
          { label: 'Exact Phrase', value: 'phrase' },
        ],
      },
    }),
    contact_email_match_type: Property.StaticDropdown({
      displayName: 'Contact Email Match Type',
      description: 'How to match the contact email.',
      required: false,
      defaultValue: 'phrase',
      options: {
        options: [
          { label: 'Exact Match (Recommended)', value: 'phrase' },
          { label: 'Contains', value: 'full_words' },
        ],
      },
    }),
  },
  async run(context) {
    const { search_field, search_term, lead_name_match_type, contact_email_match_type } = context.propsValue;
    const api_key = context.auth.username; // BasicAuth username is the API key

    let query_payload: any;
    const baseQuery = {
      "type": "object_type",
      "object_type": "lead"
    };

    let fieldCondition: any;

    if (search_field === 'lead_name') {
      fieldCondition = {
        "type": "field_condition",
        "field": {
          "type": "regular_field",
          "object_type": "lead",
          "field_name": "name"
        },
        "condition": {
          "type": "text",
          "mode": lead_name_match_type || 'full_words',
          "value": search_term
        }
      };
      query_payload = {
        "query": {
          "type": "and",
          "queries": [baseQuery, fieldCondition]
        },
        "_fields": {
          "lead": ["id", "name", "display_name", "url", "status_label", "date_created", "date_updated", "contacts"]
        }
      };
    } else if (search_field === 'contact_email') {
      fieldCondition = {
        "type": "has_related",
        "this_object_type": "lead",
        "related_object_type": "contact",
        "related_query": {
          "type": "has_related",
          "this_object_type": "contact",
          "related_object_type": "contact_email",
          "related_query": {
            "type": "field_condition",
            "field": {
              "type": "regular_field",
              "object_type": "contact_email",
              "field_name": "email"
            },
            "condition": {
              "type": "text",
              "mode": contact_email_match_type || 'phrase',
              "value": search_term
            }
          }
        }
      };
      query_payload = {
        "query": {
          "type": "and",
          "queries": [baseQuery, fieldCondition]
        },
        "_fields": {
           "lead": ["id", "name", "display_name", "url", "status_label", "date_created", "date_updated", "contacts"]
        }
      };
    } else {
      // Should not happen due to dropdown validation
      throw new Error('Invalid search_field selected.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/data/search/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${api_key}:`).toString('base64'),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: query_payload,
    });

    return response.body.data || [];
  },
});
