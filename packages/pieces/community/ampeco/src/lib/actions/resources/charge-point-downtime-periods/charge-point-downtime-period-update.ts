import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointDowntimePeriodUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod}

export const chargePointDowntimePeriodUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodUpdate',
  displayName: 'Resources - Charge Point Downtime Periods - Update',
  description: 'Update Charge Point Downtime Period.',
  props: {
        
  chargePointDowntimePeriod: Property.Number({
    displayName: 'Charge Point Downtime Period',
    required: true,
  }),

  noticeId: Property.Number({
    displayName: 'Notice Id',
    required: false,
  }),

  startedAt: Property.DateTime({
    displayName: 'Started At',
    description: 'Allowed only for downtime period with `type = exempt AND entryMode = manual`',
    required: false,
  }),

  endedAt: Property.DateTime({
    displayName: 'Ended At',
    description: 'Allowed only for downtime period with `type = exempt AND entryMode = manual`',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointDowntimePeriodUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-downtime-periods/v1.0/{chargePointDowntimePeriod}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['noticeId', 'startedAt', 'endedAt']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ChargePointDowntimePeriodUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
