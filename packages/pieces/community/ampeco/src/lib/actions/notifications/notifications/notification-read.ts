import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { NotificationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const notificationReadAction = createAction({
  auth: ampecoAuth,
  name: 'notificationRead',
  displayName: 'Notifications - V2.0 - Notification Read',
  description: 'Get a notification. (Endpoint: GET /public-api/notifications/v2.0/{notification})',
  props: {
        
  notification: Property.ShortText({
    displayName: 'Notification',
    description: '',
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
