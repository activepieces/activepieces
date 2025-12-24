import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const voucherDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'voucherDelete',
  displayName: 'Resources - Vouchers - Voucher Delete',
  description: 'Delete a Voucher. (Endpoint: DELETE /public-api/resources/vouchers/v2.1/{voucher})',
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
