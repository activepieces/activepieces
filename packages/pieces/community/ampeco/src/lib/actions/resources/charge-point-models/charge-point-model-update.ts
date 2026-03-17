import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointModelUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/charge-point-models/v1.0/{modelId}

export const chargePointModelUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointModelUpdate',
  displayName: 'Resources - Charge Point Models - Update',
  description: 'Charge Point Model.',
  props: {
        
  modelId: Property.Number({
    displayName: 'Model Id',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    required: false,
  }),

  vendorId: Property.Number({
    displayName: 'Vendor Id',
    required: false,
  }),

  userManual: Property.ShortText({
    displayName: 'User Manual',
    description: 'A download link for the user manual. Shown in the mobile app for home chargers.',
    required: false,
  }),

  installerManual: Property.ShortText({
    displayName: 'Installer Manual',
    description: 'URL to an externally-hosted installer manual. The system stores this URL reference only (does not download or cache the document) and provides it to installers for viewing/downloading through the installer app interface.',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointModelUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-point-models/v1.0/{modelId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'vendorId', 'userManual', 'installerManual']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ChargePointModelUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
