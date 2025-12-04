import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerSettlementReportPartnerSettlementRecordsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerSettlementReportPartnerSettlementRecordsListingAction = createAction({
  auth: ampecoAuth,
  name: 'partnerSettlementReportPartnerSettlementRecordsListing',
  displayName: 'Resources - Partner Settlement Reports - Partner Settlement Report Partner Settlement Records Listing',
  description: 'Get all Partner Settlement Records. (Endpoint: GET /public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records)',
  props: {
        
  partnerSettlementReport: Property.Number({
    displayName: 'Partner Settlement Report',
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
  async run(context): Promise<PartnerSettlementReportPartnerSettlementRecordsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records', context.propsValue);
      
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
      }) as PartnerSettlementReportPartnerSettlementRecordsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerSettlementReportPartnerSettlementRecordsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
