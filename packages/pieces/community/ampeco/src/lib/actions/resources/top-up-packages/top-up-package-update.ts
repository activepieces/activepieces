import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TopUpPackageUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/top-up-packages/v2.0/{topUpPackage}

export const topUpPackageUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackageUpdate',
  displayName: 'Resources - Top Up Packages - Update',
  description: 'Top-Up Packages.',
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
