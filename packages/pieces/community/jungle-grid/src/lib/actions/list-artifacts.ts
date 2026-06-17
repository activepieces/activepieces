import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const listArtifacts = createAction({
  auth: jungleGridAuth,
  name: 'list_artifacts',
  displayName: 'List Job Artifacts',
  description: 'List files produced by a Jungle Grid job when managed artifact storage is available.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the output files (artifacts) produced by a Jungle Grid job, by job ID. Pick this after a job completes to discover what it produced, then use Get Artifact Download URL to fetch a specific file; only works when the workspace has managed artifact storage. Read-only and idempotent.',
    idempotent: true,
  },
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
