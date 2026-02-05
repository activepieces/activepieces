import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PartnerSettlementReportPartnerSettlementRecordUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records/{PartnerSettlementRecord}

export const partnerSettlementReportPartnerSettlementRecordUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'partnerSettlementReportPartnerSettlementRecordUpdate',
  displayName: 'Resources - Partner Settlement Reports - Update Partner Settlement Record',
  description: 'Update a single Partner Settlement Record.',
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

  date: Property.DateTime({
    displayName: 'Date',
    description: '',
    required: true,
  }),

  paidAmount: Property.Number({
    displayName: 'Paid Amount',
    description: '',
    required: true,
  }),

  note: Property.ShortText({
    displayName: 'Note',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<PartnerSettlementReportPartnerSettlementRecordUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records/{PartnerSettlementRecord}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['date', 'paidAmount', 'note']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as PartnerSettlementReportPartnerSettlementRecordUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
