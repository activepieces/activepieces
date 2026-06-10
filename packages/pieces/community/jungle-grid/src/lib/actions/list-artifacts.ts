import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const listArtifacts = createAction({
  auth: jungleGridAuth,
  name: 'list_artifacts',
  displayName: 'List Job Artifacts',
  description: 'List files produced by a Jungle Grid job when managed artifact storage is available.',
  props: {
    job_id: jungleGridCommon.jobId,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: jungleGridCommon.endpoints.artifacts(context.propsValue.job_id),
    });
  },
});
