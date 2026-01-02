import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  prepareRequestBody,
  processPathParameters,
} from '../../../common/utils';
import { ChargePointModelCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/charge-point-models/v1.0

export const chargePointModelCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointModelCreate',
  displayName: 'Resources - Charge Point Models - Create',
  description: 'Create new Charge Point Model.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),

    vendorId: Property.Number({
      displayName: 'Vendor Id',
      required: true,
    }),

    userManual: Property.ShortText({
      displayName: 'User Manual',
      description:
        'A download link for the user manual. Shown in the mobile app for home chargers.',
      required: false,
    }),

    installerManual: Property.ShortText({
      displayName: 'Installer Manual',
      description:
        'URL to an externally-hosted installer manual. The system stores this URL reference only (does not download or cache the document) and provides it to installers for viewing/downloading through the installer app interface.',
      required: false,
    }),
  },
  async run(context): Promise<ChargePointModelCreateResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/charge-point-models/v1.0',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = prepareRequestBody(context.propsValue, [
        'name',
        'vendorId',
        'userManual',
        'installerManual',
      ]);

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      )) as ChargePointModelCreateResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
