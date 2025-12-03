import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointDowntimePeriodCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointDowntimePeriodCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDowntimePeriodCreate',
  displayName: 'Resources - Charge Point Downtime Periods - Charge Point Downtime Period Create',
  description: 'Create Manual Exempt Charge Point Downtime Period. (Endpoint: POST /public-api/resources/charge-point-downtime-periods/v1.0)',
  props: {
        
  chargePointId: Property.Number({
    displayName: 'Charge Point Id',
    description: '',
    required: true,
  }),

  noticeId: Property.Number({
    displayName: 'Notice Id',
    description: 'Allowed only notice with \`type = exempt\`!',
    required: true,
  }),

  startedAt: Property.DateTime({
    displayName: 'Started At',
    description: '',
    required: true,
  }),

  endedAt: Property.DateTime({
    displayName: 'Ended At',
    description: '',
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
