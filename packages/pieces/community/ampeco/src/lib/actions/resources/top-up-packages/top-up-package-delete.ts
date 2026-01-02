import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const topUpPackageDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackageDelete',
  displayName: 'Resources - Top Up Packages - Top Up Package Delete',
  description: 'Delete a Top-Up Package. (Endpoint: DELETE /public-api/resources/top-up-packages/v2.0/{topUpPackage})',
  props: {
        
  topUpPackage: Property.Number({
    displayName: 'Top Up Package',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/top-up-packages/v2.0/{topUpPackage}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
