import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetDowntimePeriodNoticeResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/downtime-period-notices/v1.0/{notice}

export const getDowntimePeriodNoticeAction = createAction({
  auth: ampecoAuth,
  name: 'getDowntimePeriodNotice',
  displayName: 'Resources - Downtime Period Notices - Get',
  description: 'Get Downtime Period Notice.',
  props: {
        
  notice: Property.Number({
    displayName: 'Notice',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetDowntimePeriodNoticeResponse> {
    try {
      const url = processPathParameters('/public-api/resources/downtime-period-notices/v1.0/{notice}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetDowntimePeriodNoticeResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
