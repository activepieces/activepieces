import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreateFlexibilityAssetResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/flexibility-assets/v1.0

export const createFlexibilityAssetAction = createAction({
  auth: ampecoAuth,
  name: 'createFlexibilityAsset',
  displayName: 'Resources - Flexibility Assets - Create',
  description: 'Create new flexibility asset.',
  props: {
        
  dlmCircuitId: Property.Number({
    displayName: 'Dlm Circuit Id',
    description: 'ID of the DLM circuit. Only one of dlmCircuitId, chargePointId or evseId can have value.',
    required: true,
  }),

  chargePointId: Property.Number({
    displayName: 'Charge Point Id',
    description: 'ID of the Charge Point. Only one of dlmCircuitId, chargePointId or evseId can have value.',
    required: true,
  }),

  evseId: Property.Number({
    displayName: 'Evse Id',
    description: 'ID of the EVSE. Only one of dlmCircuitId, chargePointId or evseId can have value.',
    required: true,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: 'Short description of the flexibility asset.',
    required: false,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: 'Flexibility integration.',
    required: true,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  endsAt: Property.DateTime({
    displayName: 'Ends At',
    description: 'ISO 8601 formatted date. If an end date is set the asset will be automatically disabled at that time. Historical time series and forecasts are not generated after the end date.',
    required: false,
  }),
  },
  async run(context): Promise<CreateFlexibilityAssetResponse> {
    try {
      const url = processPathParameters('/public-api/resources/flexibility-assets/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['dlmCircuitId', 'chargePointId', 'evseId', 'description', 'integrationId', 'status', 'endsAt']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreateFlexibilityAssetResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
