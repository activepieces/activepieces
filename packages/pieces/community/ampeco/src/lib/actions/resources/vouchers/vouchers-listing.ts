import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { VouchersListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/vouchers/v2.1

export const vouchersListingAction = createAction({
  auth: ampecoAuth,
  name: 'vouchersListing',
  displayName: 'Resources - Vouchers - Vouchers Listing',
  description: 'Get all Vouchers.',
  props: {
        
  filter__type: Property.StaticDropdown({
    displayName: 'Filter - Type',
    description: 'Lists only vouchers that are with one of these types `voucher`, `manual_top_up`, `top_up_auto`, `auto_top_up`, `top_up_by_operator`, `api_top_up`, `promo_code`, `subscribe_to_plan`.',
    required: false,
    options: {
      options: [
      { label: 'voucher', value: 'voucher' },
      { label: 'manual_top_up', value: 'manual_top_up' },
      { label: 'auto_top_up', value: 'auto_top_up' },
      { label: 'top_up_by_operator', value: 'top_up_by_operator' },
      { label: 'api_top_up', value: 'api_top_up' },
      { label: 'promo_code', value: 'promo_code' },
      { label: 'subscribe_to_plan', value: 'subscribe_to_plan' }
      ],
    },
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Lists only the vouchers that are with one of these statuses `enabled`, `disabled`.',
    required: false,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  filter__createdAt: Property.DateTime({
    displayName: 'Filter - Created At',
    description: 'Lists only vouchers that are created on a particular date. Please provide the value in the following format `YYYY-MM-DD`.',
    required: false,
  }),

  filter__redeemedAfter: Property.DateTime({
    displayName: 'Filter - Redeemed After',
    description: 'Lists only vouchers that are redeemed after the specified date and time. Please provide the value in ISO 8601 formatted date.',
    required: false,
  }),

  filter__redeemedBefore: Property.DateTime({
    displayName: 'Filter - Redeemed Before',
    description: 'Lists only vouchers that were redeemed before the specified date and time. Please provide the value in ISO 8601 formatted date.',
    required: false,
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Lists only vouchers that were redeemed by a particular user.',
    required: false,
  }),

  filter__expireDateAfter: Property.DateTime({
    displayName: 'Filter - Expire Date After',
    description: 'Lists only vouchers with expiration date after the specified date. Please provide the value in RFC 3339 formatted date `YYYY-MM-DD`.',
    required: false,
  }),

  filter__expireDateBefore: Property.DateTime({
    displayName: 'Filter - Expire Date Before',
    description: 'Lists only vouchers with expiration date before the specified date. Please provide the value in RFC 3339 formatted date `YYYY-MM-DD`.',
    required: false,
  }),

  filter__code: Property.ShortText({
    displayName: 'Filter - Code',
    description: 'Lists only vouchers with code which contains the specified string. Please provide min 3 chars value.',
    required: false,
  }),
    per_page: Property.Number({
      displayName: 'Per page',
      description: 'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
      required: false,
      defaultValue: 100,
    }),
    usePagination: Property.Checkbox({
      displayName: 'Paginate Results',
      description: 'Whether to automatically paginate to fetch all results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context): Promise<VouchersListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vouchers/v2.1', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'page', 'per_page']);
      
      const body = undefined;

          if (context.propsValue.usePagination) {
      return await paginate({
        auth: context.auth,
        method: 'GET',
        path: url,
        queryParams,
        body,
        perPage: context.propsValue.per_page ?? 100,
        dataPath: 'data',
      }) as VouchersListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as VouchersListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
