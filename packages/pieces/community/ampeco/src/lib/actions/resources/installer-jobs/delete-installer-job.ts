import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deleteInstallerJobAction = createAction({
  auth: ampecoAuth,
  name: 'deleteInstallerJob',
  displayName: 'Resources - Installer Jobs - Delete Installer Job',
  description: 'Delete Installer Job. (Endpoint: DELETE /public-api/resources/installer-jobs/v1.0/{installerJob})',
  props: {
        
  installerJob: Property.Number({
    displayName: 'Installer Job',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/installer-jobs/v1.0/{installerJob}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
