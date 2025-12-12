import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deleteDowntimePeriodNoticeAction = createAction({
  auth: ampecoAuth,
  name: 'deleteDowntimePeriodNotice',
  displayName: 'Resources - Downtime Period Notices - Delete Downtime Period Notice',
  description: 'Delete Downtime Period Notice. (Endpoint: DELETE /public-api/resources/downtime-period-notices/v1.0/{notice})',
  props: {
        
  notice: Property.Number({
    displayName: 'Notice',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/downtime-period-notices/v1.0/{notice}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
