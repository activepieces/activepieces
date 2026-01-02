import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointModelUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointModelUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointModelUpdate',
  displayName: 'Resources - Charge Point Models - Charge Point Model Update',
  description: 'Charge Point Model. (Endpoint: PATCH /public-api/resources/charge-point-models/v1.0/{modelId})',
  props: {
        
  modelId: Property.Number({
    displayName: 'Model Id',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  vendorId: Property.Number({
    displayName: 'Vendor Id',
    description: '',
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
