import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { VoucherReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/vouchers/v2.1/{voucher}
export const voucherReadAction = createAction({
  auth: ampecoAuth,
  name: 'voucherRead',
  displayName: 'Resources - Vouchers - Voucher Read',
  description: 'Get a Voucher.',
  props: {
        
  voucher: Property.Number({
    displayName: 'Voucher',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<VoucherReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vouchers/v2.1/{voucher}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as VoucherReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
