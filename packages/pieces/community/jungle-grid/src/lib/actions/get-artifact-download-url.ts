import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const getArtifactDownloadUrl = createAction({
  auth: jungleGridAuth,
  name: 'get_artifact_download_url',
  displayName: 'Get Artifact Download URL',
  description: 'Create a temporary signed download URL for a Jungle Grid artifact. Treat the returned URL as a secret.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate a short-lived signed download URL for one artifact of a Jungle Grid job, given the job ID and artifact ID. Pick this after List Job Artifacts when a file actually needs to be downloaded; calling it is safe to repeat (each call just issues a fresh temporary URL), but the URL expires and must be treated as a secret.',
    idempotent: true,
  },
  props: {
    job_id: jungleGridCommon.jobId,
    artifact_id: jungleGridCommon.artifactId,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.artifactDownloadUrl(
        context.propsValue.job_id,
        context.propsValue.artifact_id,
      ),
    });
  },
});
