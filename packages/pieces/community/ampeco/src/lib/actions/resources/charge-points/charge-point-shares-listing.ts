import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointSharesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointSharesListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSharesListing',
  displayName: 'Resources - Charge Points - Charge Point Shares Listing',
  description: 'Get all Shares of the Charge Point. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/shares)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
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
  async run(context): Promise<ChargePointSharesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/shares', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['per_page', 'cursor']);
      
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
      }) as ChargePointSharesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointSharesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
