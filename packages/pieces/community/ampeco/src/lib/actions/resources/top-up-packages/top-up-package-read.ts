import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TopUpPackageReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const topUpPackageReadAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackageRead',
  displayName: 'Resources - Top Up Packages - Top Up Package Read',
  description: 'Get a Top-Up Package. (Endpoint: GET /public-api/resources/top-up-packages/v2.0/{topUpPackage})',
  props: {
        
  topUpPackage: Property.Number({
    displayName: 'Top Up Package',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<TopUpPackageReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/top-up-packages/v2.0/{topUpPackage}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as TopUpPackageReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
