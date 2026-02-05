import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SettingsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/settings/v1.0

export const settingsListingAction = createAction({
  auth: ampecoAuth,
  name: 'settingsListing',
  displayName: 'Resources - Settings - Settings Listing',
  description: 'Get all settings.',
  props: {
  },
  async run(context): Promise<SettingsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/settings/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SettingsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
