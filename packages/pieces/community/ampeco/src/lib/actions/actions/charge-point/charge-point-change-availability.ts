import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointChangeAvailabilityAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointChangeAvailability',
  displayName: 'Actions - Charge Point - Charge Point Change Availability',
  description: 'change the availability to available or unavailable. A Charge Point is considered unavailable when it does not allow any charging. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/change-availability)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  evseNetworkId: Property.Number({
    displayName: 'Evse Network Id',
    description: 'The id of the connector for which availability needs to change. If missing the availability of the Charge Point and all its connectors needs to change.',
    required: false,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: `the type of availability change that the Charge Point should perform\n* \`Inoperative\` Charge point is not available for charging.\n* \`Operative\` Charge point is available for charging.\n`,
    required: true,
    options: {
      options: [
      { label: 'Inoperative', value: 'Inoperative' },
      { label: 'Operative', value: 'Operative' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/change-availability', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['evseNetworkId', 'type']
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
