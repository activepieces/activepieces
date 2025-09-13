import { createAction } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { getAdsByPage as getAdsByPageProperties } from "../properties";
import { getAdsByPageSchema } from "../schemas";

export const getAdsByPage = createAction({
  name: 'getAdsByPage',
  displayName: 'Get Ads by Page',
  description: 'Retrieve all ads belonging to a given Facebook Page ID with optional filtering and pagination. Returns structured response with metadata and ad data.',
  props: getAdsByPageProperties(),
  async run({ auth, propsValue }) {
    // Validate props using Zod schema
    const validation = getAdsByPageSchema.safeParse(propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const values = propsValue as Record<string, any>;
    const queryParams: Record<string, string> = {
      page_id: String(values['page_id']),
    };

    // Add optional parameters if provided
    if (values['start_date']) {
      queryParams['start_date'] = String(values['start_date']);
    }
    if (values['end_date']) {
      queryParams['end_date'] = String(values['end_date']);
    }
    if (values['order']) {
      queryParams['order'] = String(values['order']);
    }
    if (values['live']) {
      queryParams['live'] = String(values['live'] === 'true');
    }

    // Handle array parameters - repeat parameter name for each value
    if (values['display_format'] && values['display_format'].length > 0) {
      // Instead of passing array directly, we'll handle this in the API call
      // by building the URL manually or using a different approach
      (queryParams as any).display_format = values['display_format'];
    }
    if (values['publisher_platform'] && values['publisher_platform'].length > 0) {
      (queryParams as any).publisher_platform = values['publisher_platform'];
    }
    if (values['niches'] && values['niches'].length > 0) {
      (queryParams as any).niches = values['niches'];
    }
    if (values['market_target'] && values['market_target'].length > 0) {
      (queryParams as any).market_target = values['market_target'];
    }
    if (values['languages'] && values['languages'].length > 0) {
      (queryParams as any).languages = values['languages'];
    }

    if (values['cursor']) {
      queryParams['cursor'] = String(values['cursor']);
    }
    if (values['limit']) {
      queryParams['limit'] = String(values['limit']);
    }

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: '/api/brand/getAdsByPageId',
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
        ads: responseBody.data,
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
