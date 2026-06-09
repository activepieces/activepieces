import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters
} from '../../../common/utils';
import { ChargePointEvseConnectorUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}/connectors/{connector}

export const chargePointEvseConnectorUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseConnectorUpdate',
  displayName: 'Resources - Charge Points - Charge Point Evse Connector Update',
  description: "Update a charge point evse's connector.",
  props: {
    chargePoint: Property.Number({
      displayName: 'Charge Point',
      required: true,
    }),

    evse: Property.Number({
      displayName: 'Evse',
      required: true,
    }),

    connector: Property.Number({
      displayName: 'Connector',
      required: true,
    }),

    type: Property.StaticDropdown({
      displayName: 'Type',
      description: `Type of connector available on the EVSE:\n- **type1**: Type 1 connector (SAE J1772 AC)\n- **type2**: Type 2 connector (IEC 62196-2 AC)\n- **type3**: Type 3 connector (IEC 62196-2 AC)\n- **chademo**: CHAdeMO DC fast charging\n- **ccs1**: Combined Charging System 1 (CCS1/Combo 1)\n- **ccs2**: Combined Charging System 2 (CCS2/Combo 2)\n- **schuko**: Standard European household socket\n- **nacs**: North American Charging Standard (Tesla)\n- **cee16**: CEE 16A industrial connector\n- **cee32**: CEE 32A industrial connector\n- **j1772**: SAE J1772 connector\n- **inductive**: Inductive/wireless charging\n- **nema-5-20**: Domestic M NEMA 5-20 Socket\n- **type-e-french**: French Type E socket\n- **type-g-british**: British Type G socket\n- **type-j-swiss**: Swiss Type J socket\n- **avcon**: AVCON connector (Australian standard)\n- **gb-t-ac**: GB/T AC connector (Chinese standard)\n- **gb-t-dc**: GB/T DC connector (Chinese standard)\n- **chaoji**: ChaoJi (CHAdeMO 3.0)\n- **nema-6-30**: NEMA 6-30\n- **nema-6-50**: NEMA 6-50\n`,
      required: false,
      options: {
        options: [
          { label: 'type1', value: 'type1' },
          { label: 'type2', value: 'type2' },
          { label: 'type3', value: 'type3' },
          { label: 'chademo', value: 'chademo' },
          { label: 'ccs1', value: 'ccs1' },
          { label: 'ccs2', value: 'ccs2' },
          { label: 'schuko', value: 'schuko' },
          { label: 'nacs', value: 'nacs' },
          { label: 'cee16', value: 'cee16' },
          { label: 'cee32', value: 'cee32' },
          { label: 'j1772', value: 'j1772' },
          { label: 'inductive', value: 'inductive' },
          { label: 'nema-5-20', value: 'nema-5-20' },
          { label: 'type-e-french', value: 'type-e-french' },
          { label: 'type-g-british', value: 'type-g-british' },
          { label: 'type-j-swiss', value: 'type-j-swiss' },
          { label: 'avcon', value: 'avcon' },
          { label: 'gb-t-ac', value: 'gb-t-ac' },
          { label: 'gb-t-dc', value: 'gb-t-dc' },
          { label: 'chaoji', value: 'chaoji' },
          { label: 'nema-6-30', value: 'nema-6-30' },
          { label: 'nema-6-50', value: 'nema-6-50' },
        ],
      },
    }),

    format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      options: {
        options: [
          { label: 'socket', value: 'socket' },
          { label: 'cable', value: 'cable' },
        ],
      },
    }),

    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'enabled', value: 'enabled' },
          { label: 'disabled', value: 'disabled' },
        ],
      },
    }),
  },
  async run(context): Promise<ChargePointEvseConnectorUpdateResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}/connectors/{connector}',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, [
        'type',
        'format',
        'status',
      ]);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      )) as ChargePointEvseConnectorUpdateResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
