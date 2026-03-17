import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointEvsesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/evses

export const chargePointEvsesListingAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvsesListing',
  displayName: 'Resources - Charge Points - Charge Point Evses Listing',
  description: 'Get all EVSEs of the Charge Point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    required: false,
    options: {
      options: [
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'connectors', value: 'connectors' }
      ],
    },
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
  async run(context): Promise<ChargePointEvsesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/evses', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include', 'per_page', 'cursor']);
      
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
      }) as ChargePointEvsesListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointEvsesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
