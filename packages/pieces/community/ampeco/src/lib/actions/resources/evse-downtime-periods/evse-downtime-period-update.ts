import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { EvseDowntimePeriodUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod}

export const evseDowntimePeriodUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'evseDowntimePeriodUpdate',
  displayName: 'Resources - Evse Downtime Periods - Update',
  description: 'Update EVSE Downtime Period.',
  props: {
        
  evseDowntimePeriod: Property.Number({
    displayName: 'Evse Downtime Period',
    description: '',
    required: true,
  }),

  noticeId: Property.Number({
    displayName: 'Notice Id',
    description: '',
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
  async run(context): Promise<EvseDowntimePeriodUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evse-downtime-periods/v1.0/{evseDowntimePeriod}', context.propsValue);
      
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
      ) as EvseDowntimePeriodUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
