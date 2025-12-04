import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointConfigurationUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointConfigurationUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointConfigurationUpdate',
  displayName: 'Resources - Charge Points - Charge Point Configuration Update',
  description: 'Update a charge point&#x27;s configuration. The configuration is applied directly to the charge point and you will get response code 406 in case the application fails. (Endpoint: PATCH /public-api/resources/charge-points/v2.0/{chargePoint}/configurations/{key})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  key: Property.ShortText({
    displayName: 'Key',
    description: '',
    required: true,
  }),

  value: Property.ShortText({
    displayName: 'Value',
    description: 'This field is required when the configuration key is one of the standard OCPP keys, as defined in the OCPP documentation under \"Standard Configuration Key Names & Values\".',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointConfigurationUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/configurations/{key}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['value']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ChargePointConfigurationUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
