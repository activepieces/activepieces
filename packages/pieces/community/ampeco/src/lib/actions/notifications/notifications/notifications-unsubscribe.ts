import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const notificationsUnsubscribeAction = createAction({
  auth: ampecoAuth,
  name: 'notificationsUnsubscribe',
  displayName: 'Notifications - V2.0 - Notifications Unsubscribe',
  description: 'Unsubscribe for a notification. (Endpoint: DELETE /public-api/notifications/v2.0/{notification})',
  props: {
        
  notification: Property.ShortText({
    displayName: 'Notification',
    description: '',
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
