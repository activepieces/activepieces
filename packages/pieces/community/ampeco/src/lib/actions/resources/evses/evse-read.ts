import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { EvseReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const evseReadAction = createAction({
  auth: ampecoAuth,
  name: 'evseRead',
  displayName: 'Resources - Evses - Evse Read',
  description: 'Get an EVSE. (Endpoint: GET /public-api/resources/evses/v2.1/{evse})',
  props: {
        
  evse: Property.Number({
    displayName: 'Evse',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'connectors', value: 'connectors' },
      { label: 'externalAppData', value: 'externalAppData' }
      ],
    },
  }),
  },
  async run(context): Promise<EvseReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evses/v2.1/{evse}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as EvseReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
