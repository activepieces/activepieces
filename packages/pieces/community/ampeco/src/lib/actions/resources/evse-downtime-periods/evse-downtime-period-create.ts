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
  audience: 'both',
  aiMetadata: { description: 'Create a manual exempt downtime period for an EVSE, specifying the EVSE ID, an exempt-type notice ID, and start/end times. Not idempotent: each call creates a new period, so avoid duplicate calls for the same window. Use evse-downtime-period-update to adjust an existing period instead.', idempotent: false },
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
