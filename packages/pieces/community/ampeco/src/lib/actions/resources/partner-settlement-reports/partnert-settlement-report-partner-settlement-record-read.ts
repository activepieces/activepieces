import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnertSettlementReportPartnerSettlementRecordReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnertSettlementReportPartnerSettlementRecordReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnertSettlementReportPartnerSettlementRecordRead',
  displayName: 'Resources - Partner Settlement Reports - Partnert Settlement Report Partner Settlement Record Read',
  description: 'Read Partner Settlement Record. (Endpoint: GET /public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records/{PartnerSettlementRecord})',
  props: {
        
  partnerSettlementReport: Property.Number({
    displayName: 'Partner Settlement Report',
    description: '',
    required: true,
  }),

  PartnerSettlementRecord: Property.Number({
    displayName: 'Partner Settlement Record',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PartnertSettlementReportPartnerSettlementRecordReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records/{PartnerSettlementRecord}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as PartnertSettlementReportPartnerSettlementRecordReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
