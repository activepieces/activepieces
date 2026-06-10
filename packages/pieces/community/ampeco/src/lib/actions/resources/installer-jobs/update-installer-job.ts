import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UpdateInstallerJobResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const updateInstallerJobAction = createAction({
  auth: ampecoAuth,
  name: 'updateInstallerJob',
  displayName: 'Resources - Installer Jobs - Update',
  description: 'Update Installer Job.',
  props: {
        
  installerJob: Property.Number({
    displayName: 'Installer Job',
    description: '',
    required: true,
  }),

  installerAdminId: Property.Number({
    displayName: 'Installer Admin Id',
    description: 'The ID of the installer admin if such is assigned to the installer job, if passed pin will be ignored',
    required: false,
  }),

  pin: Property.ShortText({
    displayName: 'Pin',
    description: 'The PIN of the installer job, it is used to verify access rights to execute the installer job, if passed and no installerAdminId is provided, the pin will be assigned to the installer job',
    required: false,
  }),

  description: Property.ShortText({
    displayName: 'Description',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<UpdateInstallerJobResponse> {
    try {
      const url = processPathParameters('/public-api/resources/installer-jobs/v1.0/{installerJob}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['installerAdminId', 'pin', 'description']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UpdateInstallerJobResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
