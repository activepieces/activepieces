import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { VendorErrorCodesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/vendor-error-codes/v2.0
export const vendorErrorCodesListingAction = createAction({
  auth: ampecoAuth,
  name: 'vendorErrorCodesListing',
  displayName: 'Resources - Vendor Error Codes - Vendor Error Codes Listing',
  description: 'Get all Vendor Error Codes.',
  props: {
        
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
  async run(context): Promise<VendorErrorCodesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/vendor-error-codes/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['page', 'per_page']);
      
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
      }) as VendorErrorCodesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as VendorErrorCodesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
