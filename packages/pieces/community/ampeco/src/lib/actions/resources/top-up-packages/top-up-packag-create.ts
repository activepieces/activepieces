import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TopUpPackagCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const topUpPackagCreateAction = createAction({
  auth: ampecoAuth,
  name: 'topUpPackagCreate',
  displayName: 'Resources - Top Up Packages - Top Up Packag Create',
  description: 'Create new Top-Up Package. (Endpoint: POST /public-api/resources/top-up-packages/v2.0)',
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
    description: 'By default is set to \`false\`.',
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
