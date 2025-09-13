import { createAction, Property } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const findBrands = createAction({
  name: 'findBrands',
  displayName: 'Find Brands',
  description: 'Search for brands associated with a specific domain name. Returns structured response with metadata and brand data.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Domain name to search for. Can be a full URL (e.g., "https://example.com") or just the domain (e.g., "example.com").',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Pagination limit (default 10, max 10). Controls the number of brands returned per request.',
      required: false,
      defaultValue: 10,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Order of results: most_ranked (default) or least_ranked. Sorts brands by relevance ranking.',
      required: false,
      options: {
        options: [
          { label: 'Most Ranked', value: 'most_ranked' },
          { label: 'Least Ranked', value: 'least_ranked' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const values = propsValue as Record<string, any>;
    const queryParams: Record<string, string> = {
      domain: String(values['domain']),
    };

    // Add optional parameters if provided
    if (values['limit']) {
      queryParams['limit'] = String(values['limit']);
    }
    if (values['order']) {
      queryParams['order'] = String(values['order']);
    }

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/api/brand/getBrandsByDomain',
      queryParams,
    });

    const responseBody = response.body;

    // Check if the response is successful
    if (responseBody.metadata && responseBody.metadata.success === true) {
      // Return the structured response with both metadata and data
      return {
        success: true,
        metadata: responseBody.metadata,
        data: responseBody.data,
        // Also include top-level fields for easy access
        brands: responseBody.data,
        statusCode: responseBody.metadata.status_code,
        message: responseBody.metadata.message
      };
    } else {
      // Handle error responses
      return {
        success: false,
        metadata: responseBody.metadata,
        error: responseBody.error,
        data: responseBody.data || null,
        statusCode: responseBody.metadata?.status_code || response.status,
        message: responseBody.metadata?.message || 'Request failed'
      };
    }
  },
});
