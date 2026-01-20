import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { RoamingOperatorUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/roaming-operators/v2.0/{roamingOperator}

export const roamingOperatorUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'roamingOperatorUpdate',
  displayName: 'Resources - Roaming Operators - Roaming Operator Update',
  description: 'Update Roaming Operator.',
  props: {
        
  roamingOperator: Property.Number({
    displayName: 'Roaming Operator',
    description: '',
    required: true,
  }),

  businessName: Property.ShortText({
    displayName: 'Business Name',
    description: '',
    required: false,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: 'If a non-null value is provided, it will set enabled to true. If null is provided, it will set enabled to false.',
    required: false,
  }),

  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  cpoSettings__cpoQrcodePrefix: Property.ShortText({
    displayName: 'Cpo Settings - Cpo Qrcode Prefix',
    description: 'Example - "http://m.intercharge.eu/qr?evseid=" if the URL in the QR Code is http://m.intercharge.eu/qr?evseid=CH*ION*E213604.',
    required: false,
  }),

  cpoSettings__manualEvseManagement: Property.StaticDropdown({
    displayName: 'Cpo Settings - Manual Evse Management',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  cpoSettings__applyCustomTariffsToEvsesWithRoamingTariff: Property.StaticDropdown({
    displayName: 'Cpo Settings - Apply Custom Tariffs To Evses With Roaming Tariff',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  cpoSettings__sendsPeriodicMeterUpdates: Property.StaticDropdown({
    displayName: 'Cpo Settings - Sends Periodic Meter Updates',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  cpoSettings__externalTariffIntegration: Property.ShortText({
    displayName: 'Cpo Settings - External Tariff Integration',
    description: 'Only possible value is `has.to.be`.',
    required: false,
  }),

  cpoSettings__threatEvseStatusUnknownAs: Property.StaticDropdown({
    displayName: 'Cpo Settings - Threat Evse Status Unknown As',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'available', value: 'available' },
      { label: 'unavailable', value: 'unavailable' }
      ],
    },
  }),

  cpoSettings__phaseAcPowerFormula: Property.StaticDropdown({
    displayName: 'Cpo Settings - Phase Ac Power Formula',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'amperage_voltage_3', value: 'amperage_voltage_3' },
      { label: 'amperage_voltage_sqr3', value: 'amperage_voltage_sqr3' }
      ],
    },
  }),
  },
  async run(context): Promise<RoamingOperatorUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-operators/v2.0/{roamingOperator}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['businessName', 'partnerId', 'enabled', 'cpoSettings']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as RoamingOperatorUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
