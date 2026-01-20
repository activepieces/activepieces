import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PartnerSettlementReportsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/partner-settlement-reports/v1.0

export const partnerSettlementReportsListingAction = createAction({
  auth: ampecoAuth,
  name: 'partnerSettlementReportsListing',
  displayName: 'Resources - Partner Settlement Reports - Listing',
  description: 'Get all Partner Settlement Reports.',
  props: {
        
  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: '',
    required: false,
  }),

  filter__periodAfter: Property.DateTime({
    displayName: 'Filter - Period After',
    description: '',
    required: false,
  }),

  filter__periodBefore: Property.DateTime({
    displayName: 'Filter - Period Before',
    description: '',
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
  async run(context): Promise<PartnerSettlementReportsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-settlement-reports/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['filter', 'per_page', 'cursor']);
      
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
      }) as PartnerSettlementReportsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerSettlementReportsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
