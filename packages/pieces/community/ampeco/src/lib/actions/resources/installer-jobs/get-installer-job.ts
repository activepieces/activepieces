import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetInstallerJobResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/installer-jobs/v1.0/{installerJob}

export const getInstallerJobAction = createAction({
  auth: ampecoAuth,
  name: 'getInstallerJob',
  displayName: 'Resources - Installer Jobs - Get',
  description: 'Get Installer Job.',
  props: {
        
  installerJob: Property.Number({
    displayName: 'Installer Job',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'chargePoints', value: 'chargePoints' }
      ],
    },
  }),
  },
  async run(context): Promise<GetInstallerJobResponse> {
    try {
      const url = processPathParameters('/public-api/resources/installer-jobs/v1.0/{installerJob}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetInstallerJobResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
