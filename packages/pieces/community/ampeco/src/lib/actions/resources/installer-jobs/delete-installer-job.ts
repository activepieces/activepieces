import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/installer-jobs/v1.0/{installerJob}

export const deleteInstallerJobAction = createAction({
  auth: ampecoAuth,
  name: 'deleteInstallerJob',
  displayName: 'Resources - Installer Jobs - Delete',
  description: 'Delete Installer Job.',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete an installer job by its numeric ID. Use when removing a job; this is destructive and cannot be undone, so confirm the ID first. Re-running after the job is gone will error.', idempotent: false },
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
