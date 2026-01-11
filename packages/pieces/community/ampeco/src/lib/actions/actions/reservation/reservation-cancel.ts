import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/reservation/v1.0/{reservation}/cancel
export const reservationCancelAction = createAction({
  auth: ampecoAuth,
  name: 'reservationCancel',
  displayName: 'Actions - Reservation - Reservation Cancel',
  description: 'Cancel a reservation.',
  props: {
        
  reservation: Property.Number({
    displayName: 'Reservation',
    required: true,
  }),

  force: Property.StaticDropdown({
    displayName: 'Force',
    description: 'Use force=true when you want to end the reservation regardless of the CP response',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: 'In case reason is empty, following text "Activated via API" will be added automatically',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/reservation/v1.0/{reservation}/cancel', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['force', 'reason']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
