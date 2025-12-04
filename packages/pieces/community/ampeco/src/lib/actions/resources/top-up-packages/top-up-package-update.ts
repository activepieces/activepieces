import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TopUpPackageUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const topUpPackageUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackageUpdate',
  displayName: 'Resources - Top Up Packages - Top Up Package Update',
  description: 'Top-Up Packages. (Endpoint: PATCH /public-api/resources/top-up-packages/v2.0/{topUpPackage})',
  props: {
        
  topUpPackage: Property.Number({
    displayName: 'Top Up Package',
    description: '',
    required: true,
  }),

  price: Property.Number({
    displayName: 'Price',
    description: '',
    required: false,
  }),

  bonus: Property.Number({
    displayName: 'Bonus',
    description: '',
    required: false,
  }),

  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<TopUpPackageUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/top-up-packages/v2.0/{topUpPackage}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['price', 'bonus', 'enabled']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as TopUpPackageUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
