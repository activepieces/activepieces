import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { PartnerSettlementReportReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}

export const partnerSettlementReportReadAction = createAction({
  auth: ampecoAuth,
  name: 'partnerSettlementReportRead',
  displayName: 'Resources - Partner Settlement Reports - Read',
  description: 'Get a single Partner Settlement Report.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single partner settlement report by its numeric id. Read-only and idempotent. Use when you know the report id; to discover reports by partner or period use the Listing action, and for the records inside a report use the records listing/read actions.', idempotent: true },
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
