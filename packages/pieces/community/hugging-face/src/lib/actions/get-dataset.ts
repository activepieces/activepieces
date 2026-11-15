import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { getDatasetOutputSchema } from '../output-schemas';

export const getDataset = createAction({
  auth: huggingFaceAuth,
  name: 'get_dataset',
  classification: 'READ',
  displayName: 'Get Dataset',
  description: 'Get the Hub metadata of one dataset repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the Hub repository metadata of one dataset: card data, tags, file list (siblings), gating, downloads and likes, optionally at a specific revision. Use it after Search Datasets to inspect a dataset repository; its README or other text files can then be read with Read Repo File. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getDatasetOutputSchema,
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
      path: `/api/datasets/${hfRepo.encodeRepoId(repo_id)}${revisionPath}`,
    });
    return response.body;
  },
});
