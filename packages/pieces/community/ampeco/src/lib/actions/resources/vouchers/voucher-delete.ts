import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/vouchers/v2.1/{voucher}
export const voucherDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'voucherDelete',
  displayName: 'Resources - Vouchers - Voucher Delete',
  description: 'Delete a Voucher.',
  props: {
        
  voucher: Property.Number({
    displayName: 'Voucher',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/vouchers/v2.1/{voucher}', context.propsValue);
      
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
