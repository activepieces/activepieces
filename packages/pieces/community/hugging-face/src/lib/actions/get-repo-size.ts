import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { getRepoSizeOutputSchema } from '../output-schemas';

export const getRepoSize = createAction({
  auth: huggingFaceAuth,
  name: 'get_repo_size',
  classification: 'READ',
  displayName: 'Get Repo Size',
  description: 'Get the total size in bytes of a repository, or of one folder in it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the total size in bytes of every file under a path of a Hub repository at a revision (the whole repository when the path is empty), counting LFS files at their real size. Use it to judge download cost before fetching a model; for per-file sizes use List Repo Files or Get File/Folder Info. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: getRepoSizeOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    revision: hfProps.revision(),
    path: Property.ShortText({
      displayName: 'Folder Path',
      description: "Folder to measure, for example 'onnx'. Leave empty for the whole repository.",
      required: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, revision, path } = context.propsValue;
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const encodedPath = hfRepo.encodeFilePath(path);
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/treesize/${hfRepo.encodeRevision(revision)}${encodedPath ? `/${encodedPath}` : ''}`,
    });
    return response.body;
  },
});
