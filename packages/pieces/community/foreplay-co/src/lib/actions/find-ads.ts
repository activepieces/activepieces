import { createAction } from '@activepieces/pieces-framework';
import { foreplayCoApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { findAds as findAdsProperties } from '../properties';
import { findAdsSchema } from '../schemas';

export const findAds = createAction({
  name: 'findAds',
  displayName: 'Find Ads',
  description:
    'Search and filter ads by text, dates, platforms, and categories.',
  props: findAdsProperties(),
  async run({ auth, propsValue }) {
    // Validate props using Zod schema
    const validation = findAdsSchema.safeParse(propsValue);
    if (!validation.success) {
      throw new Error(`Validation failed: ${validation.error.message}`);
    }

    const values = propsValue;

    // Build query parameters properly handling arrays for API
    const queryParams = new URLSearchParams();

    // Add optional parameters if provided
    if (values['query']) {
      queryParams.append('query', String(values['query']));
    }
    if (values['start_date']) {
      queryParams.append('start_date', String(values['start_date']));
    }
    if (values['end_date']) {
      queryParams.append('end_date', String(values['end_date']));
    }
    if (values['order']) {
      queryParams.append('order', String(values['order']));
    }
    if (values['live']) {
      queryParams.append('live', String(values['live']));
    }

    // Handle array parameters - repeat parameter name for each value
    if (values['display_format'] && values['display_format'].length > 0) {
      values['display_format'].forEach((format: unknown) => {
        queryParams.append('display_format', String(format));
      });
    }
    if (
      values['publisher_platform'] &&
      values['publisher_platform'].length > 0
    ) {
      values['publisher_platform'].forEach((platform: unknown) => {
        queryParams.append('publisher_platform', String(platform));
      });
    }
    if (values['niches'] && values['niches'].length > 0) {
      values['niches'].forEach((niche: unknown) => {
        queryParams.append('niches', String(niche));
      });
    }
    if (values['market_target'] && values['market_target'].length > 0) {
      values['market_target'].forEach((target: unknown) => {
        queryParams.append('market_target', String(target));
      });
    }
    if (values['languages'] && values['languages'].length > 0) {
      values['languages'].forEach((language: unknown) => {
        queryParams.append('languages', String(language));
      });
    }

    if (values['cursor']) {
      queryParams.append('cursor', String(values['cursor']));
    }
    if (values['limit']) {
      queryParams.append('limit', String(values['limit']));
    }

    // Build the full URL with query parameters manually to handle arrays properly
    const queryString = queryParams.toString();
    const fullUrl = queryString
      ? `/api/discovery/ads?${queryString}`
      : '/api/discovery/ads';

    const response = await foreplayCoApiCall({
      apiKey: auth as string,
      method: HttpMethod.GET,
      resourceUri: fullUrl,
    });

    const responseBody = response.body;

    // Check if the response is successful
    if (responseBody.metadata && responseBody.metadata.success === true) {
      // Return just the ads data for clean automation workflows
      return responseBody.data;
    } else {
      // Handle error responses by throwing an error
      const errorMessage =
        responseBody.error ||
        responseBody.metadata?.message ||
        'Failed to find ads';
      throw new Error(`Foreplay.co API Error: ${errorMessage}`);
    }
  },
});
