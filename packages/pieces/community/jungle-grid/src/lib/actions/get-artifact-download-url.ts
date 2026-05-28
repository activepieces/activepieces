import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../..';
import { jungleGridCommon } from '../common';

export const getArtifactDownloadUrl = createAction({
  auth: jungleGridAuth,
  name: 'get_artifact_download_url',
  displayName: 'Get Artifact Download URL',
  description: 'Get a temporary download URL or download metadata for a Jungle Grid artifact.',
  props: {
    job_id: jungleGridCommon.jobId,
    artifact_id: jungleGridCommon.artifactId,
  },
  async run(context) {
    const response = await jungleGridCommon.apiCall<Record<string, unknown>>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.artifactDownloadUrl(
        context.propsValue.job_id,
        context.propsValue.artifact_id,
      ),
    });

    return jungleGridCommon.toFlatRecord(response.body);
  },
});
