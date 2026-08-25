import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v2.0/{chargePoint}/set-configuration

export const chargePointSetConfigurationAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSetConfiguration',
  displayName: 'Actions - Charge Point - Set Configuration',
  description: 'Set Configuration for the Charge Point.',
  audience: 'both',
  aiMetadata: { description: 'Send an OCPP ChangeConfiguration/SetVariables command writing a single configuration key (name) to a value on a charge point; OCPP 2.0.1 stations also accept component name, instance, and EVSE id. Use to change a station setting; use sync-configuration to read keys instead. Writing the same value yields the same end state, so it is effectively idempotent.', idempotent: true },
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  value: Property.ShortText({
    displayName: 'Value',
    description: 'Value to be assigned to specific configuration key',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: 'Name of the variable of the configuration key',
    required: true,
  }),

  instance: Property.ShortText({
    displayName: 'Instance',
    description: 'Specify instance for OCPP 2.0.1 configuration keys',
    required: false,
  }),

  componentName: Property.ShortText({
    displayName: 'Component Name',
    description: 'Required in order to specify component name for OCPP 2.0.1 configuration keys',
    required: false,
  }),

  evseId: Property.Number({
    displayName: 'Evse Id',
    description: 'ID of the EVSE. Only for OCPP 2.0.1 configuration keys',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v2.0/{chargePoint}/set-configuration', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['value', 'name', 'instance', 'componentName', 'evseId']
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
