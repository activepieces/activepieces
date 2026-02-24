import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { UserExportAllPrivateDataResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/actions/users/v2.0/{user}/export-all-private-data
export const userExportAllPrivateDataAction = createAction({
  auth: ampecoAuth,
  name: 'userExportAllPrivateData',
  displayName: 'Actions - Users - Export All Private Data',
  description: 'Export all private data.',
  props: {
        
  user: Property.Number({
    displayName: 'User',
    required: true,
  }),
  },
  async run(context): Promise<UserExportAllPrivateDataResponse> {
    try {
      const url = processPathParameters('/public-api/actions/users/v2.0/{user}/export-all-private-data', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as UserExportAllPrivateDataResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
