import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { NotificationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/notifications/v2.0/{notification}
export const notificationReadAction = createAction({
  auth: ampecoAuth,
  name: 'notificationRead',
  displayName: 'Notifications - V2.0 - Notification Read',
  description: 'Get a notification.',
  props: {
        
  notification: Property.ShortText({
    displayName: 'Notification',
    required: true,
  }),
  },
  async run(context): Promise<NotificationReadResponse> {
    try {
      const url = processPathParameters('/public-api/notifications/v2.0/{notification}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as NotificationReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
