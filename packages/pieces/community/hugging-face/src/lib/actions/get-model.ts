import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { getModelOutputSchema } from '../output-schemas';

export const getModel = createAction({
  auth: huggingFaceAuth,
  name: 'get_model',
  classification: 'READ',
  displayName: 'Get Model',
  description: 'Get the Hub metadata of one model repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the Hub metadata of one model: card data, tags, pipeline_tag, library, file list (siblings), gating, downloads and likes, optionally at a specific revision. Use it after Search Models to inspect a model before running it or reading its files with Read Repo File. Legacy un-namespaced IDs such as 'gpt2' are followed to their canonical owner. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getModelOutputSchema,
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
      path: `/api/models/${hfRepo.encodeRepoId(repo_id)}${revisionPath}`,
    });
    return response.body;
  },
});
