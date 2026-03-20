import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreateInstallerJobResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/installer-jobs/v1.0)

export const createInstallerJobAction = createAction({
  auth: ampecoAuth,
  name: 'createInstallerJob',
  displayName: 'Resources - Installer Jobs - Create',
  description: 'Create Installer Job.',
  props: {
        
  installationAndMaintenanceCompanyId: Property.Number({
    displayName: 'Installation And Maintenance Company Id',
    description: 'The ID of the installation and maintenance company which the installer job is assigned to',
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
    required: true,
  }),
  },
  async run(context): Promise<CreateInstallerJobResponse> {
    try {
      const url = processPathParameters('/public-api/resources/installer-jobs/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['installationAndMaintenanceCompanyId', 'installerAdminId', 'pin', 'description']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreateInstallerJobResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
