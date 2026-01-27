import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { FirmwareVersionReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/firmware-versions/v1.0/{firmwareVersion}

export const firmwareVersionReadAction = createAction({
  auth: ampecoAuth,
  name: 'firmwareVersionRead',
  displayName: 'Resources - Firmware Versions - Read',
  description: 'Get a Firmware Version.',
  props: {
        
  firmwareVersion: Property.Number({
    displayName: 'Firmware Version',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'models', value: 'models' }
      ],
    },
  }),
  },
  async run(context): Promise<FirmwareVersionReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/firmware-versions/v1.0/{firmwareVersion}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as FirmwareVersionReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
