import { createAction } from "@activepieces/pieces-framework";
import { foreplayCoApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";
import { getAdById as getAdByIdProperties } from "../properties";
import { getAdByIdSchema } from "../schemas";

export const getAdById = createAction({
  name: 'getAdById',
  displayName: 'Get Ad by ID',
  description: 'Retrieve detailed information about a specific ad given its unique ad ID. Returns structured response with metadata and ad data.',
  props: getAdByIdProperties(),
  async run({ auth, propsValue }) {
    // Validate props using Zod schema
    const validation = getAdByIdSchema.safeParse(propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const adId = propsValue.ad_id;

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: `/api/ad/${adId}`,
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
        ad: responseBody.data,
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
