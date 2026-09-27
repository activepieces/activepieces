import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import {
  PuppetflowArtifact,
  puppetflowRequest,
  runPath,
} from '../common/client';
import {
  artifactTypeDropdown,
  credentialsOf,
  flowIdDropdown,
  runIdDropdown,
} from '../common/props';

export const listArtifactsAction = createAction({
  auth: puppetflowAuth,
  name: 'list_artifacts',
  displayName: 'List Artifacts',
  description: 'List the screenshots or downloaded files produced by a run',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the screenshot or download files produced by a Puppetflow run, with their name, size, and modification time. Use the returned name with Download Artifact. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    flowId: flowIdDropdown,
    runId: runIdDropdown,
    artifactType: artifactTypeDropdown,
  },
  async run(context) {
    const { flowId, runId, artifactType } = context.propsValue;
    return puppetflowRequest<PuppetflowArtifact[]>({
      credentials: credentialsOf(context.auth),
      method: HttpMethod.GET,
      path: `${runPath(flowId, runId)}/artifacts/${artifactType}`,
    });
  },
});
