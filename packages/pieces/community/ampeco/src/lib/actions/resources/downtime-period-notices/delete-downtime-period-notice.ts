import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/downtime-period-notices/v1.0/{notice}

export const deleteDowntimePeriodNoticeAction = createAction({
  auth: ampecoAuth,
  name: 'deleteDowntimePeriodNotice',
  displayName: 'Resources - Downtime Period Notices - Delete',
  description: 'Delete Downtime Period Notice.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a downtime period notice by its numeric ID. Use when removing a notice; this is destructive and cannot be undone, so confirm the ID first. Re-running after the notice is gone will error.', idempotent: false },
  props: {
        
  notice: Property.Number({
    displayName: 'Notice',
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
