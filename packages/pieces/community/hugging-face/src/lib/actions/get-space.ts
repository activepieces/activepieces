import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { getSpaceOutputSchema } from '../output-schemas';

export const getSpace = createAction({
  auth: huggingFaceAuth,
  name: 'get_space',
  classification: 'READ',
  displayName: 'Get Space',
  description: 'Get the Hub metadata of one Space.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the Hub metadata of one Space: its SDK, runtime stage (for example RUNNING, BUILDING, SLEEPING or RUNTIME_ERROR), hardware, file list, tags and likes, optionally at a specific revision. Use it after Search Spaces to check whether a Space is up and how it is built. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getSpaceOutputSchema,
  props: {
    repo_id: hfProps.repoId(),
    revision: hfProps.optionalRevision(),
  },
  async run(context) {
    const { repo_id, revision } = context.propsValue;
    const revisionPath = revision?.trim() ? `/revision/${hfRepo.encodeRevision(revision)}` : '';
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/spaces/${hfRepo.encodeRepoId(repo_id)}${revisionPath}`,
    });
    return response.body;
  },
});
