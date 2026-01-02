import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { PartnerSettlementReportPartnerSettlementRecordCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const partnerSettlementReportPartnerSettlementRecordCreateAction = createAction({
  auth: ampecoAuth,
  name: 'partnerSettlementReportPartnerSettlementRecordCreate',
  displayName: 'Resources - Partner Settlement Reports - Partner Settlement Report Partner Settlement Record Create',
  description: 'Create Partner Settlement Record. (Endpoint: POST /public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records)',
  props: {
        
  partnerSettlementReport: Property.Number({
    displayName: 'Partner Settlement Report',
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
  async run(context): Promise<PartnerSettlementReportPartnerSettlementRecordCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-settlement-reports/v1.0/{partnerSettlementReport}/records', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['date', 'paidAmount', 'note']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as PartnerSettlementReportPartnerSettlementRecordCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
