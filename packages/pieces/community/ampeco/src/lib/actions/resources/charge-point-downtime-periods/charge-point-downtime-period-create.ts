import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointDowntimePeriodCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/charge-point-downtime-periods/v1.0

export const chargePointDowntimePeriodCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodCreate',
  displayName: 'Resources - Charge Point Downtime Periods - Create',
  description: 'Create Manual Exempt Charge Point Downtime Period.',
  props: {
        
  chargePointId: Property.Number({
    displayName: 'Charge Point Id',
    required: true,
  }),

  noticeId: Property.Number({
    displayName: 'Notice Id',
    description: 'Allowed only notice with `type = exempt`!',
    required: true,
  }),

  startedAt: Property.DateTime({
    displayName: 'Started At',
    required: true,
  }),

  endedAt: Property.DateTime({
    displayName: 'Ended At',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointDowntimePeriodCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-downtime-periods/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['chargePointId', 'noticeId', 'startedAt', 'endedAt']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointDowntimePeriodCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
