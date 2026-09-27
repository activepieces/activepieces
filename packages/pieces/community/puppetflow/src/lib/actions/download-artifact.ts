import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import { contentTypeOf, puppetflowRawRequest, runPath } from '../common/client';
import {
  artifactTypeDropdown,
  credentialsOf,
  flowIdDropdown,
  runIdDropdown,
} from '../common/props';

export const downloadArtifactAction = createAction({
  auth: puppetflowAuth,
  name: 'download_artifact',
  displayName: 'Download Artifact',
  description: 'Download a screenshot or a downloaded file produced by a run',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads one screenshot or downloaded file produced by a Puppetflow run and returns it as a file for later steps. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: flowIdDropdown,
    runId: runIdDropdown,
    artifactType: artifactTypeDropdown,
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'File name as returned by List Artifacts, for example screenshot_00.png',
      required: true,
    }),
  },
  async run(context) {
    const { flowId, runId, artifactType, filename } = context.propsValue;
    const response = await puppetflowRawRequest<Buffer>({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path: `${runPath(flowId, runId)}/artifacts/${artifactType}/${encodeURIComponent(
        filename
      )}`,
      responseType: 'arraybuffer',
    });

    const file = await context.files.write({
      fileName: filename,
      data: Buffer.from(response.body),
    });

    return {
      run_id: runId,
      artifact_type: artifactType,
      filename,
      content_type: contentTypeOf(response.headers, 'application/octet-stream'),
      file,
    };
  },
});
