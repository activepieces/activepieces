import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { EvseDowntimePeriodCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/evse-downtime-periods/v1.0

export const evseDowntimePeriodCreateAction = createAction({
  auth: ampecoAuth,
  name: 'evseDowntimePeriodCreate',
  displayName: 'Resources - Evse Downtime Periods - Create',
  description: 'Create Manual Exempt EVSE Downtime Period.',
  props: {
        
  evseId: Property.Number({
    displayName: 'Evse Id',
    description: '',
    required: true,
  }),

  noticeId: Property.Number({
    displayName: 'Notice Id',
    description: 'Allowed only notice with `type = exempt`!',
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
  async run(context): Promise<EvseDowntimePeriodCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evse-downtime-periods/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['evseId', 'noticeId', 'startedAt', 'endedAt']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as EvseDowntimePeriodCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
