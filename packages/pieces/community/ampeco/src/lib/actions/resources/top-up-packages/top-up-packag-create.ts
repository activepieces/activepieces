import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TopUpPackagCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/top-up-packages/v2.0
export const topUpPackagCreateAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackagCreate',
  displayName: 'Resources - Top Up Packages - Create',
  description: 'Create new Top-Up Package.',
  props: {
        
  price: Property.Number({
    displayName: 'Price',
    description: '',
    required: true,
  }),

  bonus: Property.Number({
    displayName: 'Bonus',
    description: '',
    required: true,
  }),

  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'By default is set to `false`.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<TopUpPackagCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/top-up-packages/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['price', 'bonus', 'enabled']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as TopUpPackagCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
