import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/notifications/v2.0/{notification}

export const notificationsUnsubscribeAction = createAction({
  auth: ampecoAuth,
  name: 'notificationsUnsubscribe',
  displayName: 'Notifications - V2.0 - Notifications Unsubscribe',
  description: 'Unsubscribe for a notification.',
  props: {
        
  notification: Property.ShortText({
    displayName: 'Notification',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/notifications/v2.0/{notification}', context.propsValue);
      
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
