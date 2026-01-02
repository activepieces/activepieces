import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerSettlementReportReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerSettlementReportReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerSettlementReportRead',
  displayName: 'Resources - Partner Settlement Reports - Partner Settlement Report Read',
  description: 'Get a single Partner Settlement Report. (Endpoint: GET /public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport})',
  props: {
        
  partnerSettlementReport: Property.Number({
    displayName: 'Partner Settlement Report',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PartnerSettlementReportReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnerSettlementReportReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
