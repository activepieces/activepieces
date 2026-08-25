import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/users/v2.0/{user}/redeem-voucher
export const userRedeemVoucherAction = createAction({
  auth: ampecoAuth,
  name: 'userRedeemVoucher',
  displayName: 'Actions - Users - Redeem Voucher',
  description: 'Apply a voucher to a user.',
  audience: 'both',
  aiMetadata: { description: 'Redeem a voucher code on behalf of a user, granting whatever benefit the voucher carries. Not idempotent: each call consumes a redemption, so re-running may redeem again or fail if the code is single-use or already spent.', idempotent: false },
  props: {
        
  user: Property.Number({
    displayName: 'User',
    required: true,
  }),

  code: Property.ShortText({
    displayName: 'Code',
    description: 'The code of the voucher that should be redeemed.',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/users/v2.0/{user}/redeem-voucher', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['code']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
