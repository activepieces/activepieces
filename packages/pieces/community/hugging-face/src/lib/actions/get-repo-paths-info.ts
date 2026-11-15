import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { getRepoPathsInfoOutputSchema } from '../output-schemas';

export const getRepoPathsInfo = createAction({
  auth: huggingFaceAuth,
  name: 'get_repo_paths_info',
  classification: 'READ',
  displayName: 'Get File/Folder Info',
  description: 'Get size, LFS and last-commit details for specific files or folders in a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns details for up to 2000 known paths in a Hub repository at a revision: type (file or directory), size, blob id, LFS info and, with Include Last Commit, the last commit and security status. Use it when you already know the paths (from List Repo Files) and need their sizes, for example to check a file fits the Read Repo File limit. Read-only and safe to retry; paths that do not exist are simply left out.',
    idempotent: true,
  },
  outputSchema: getRepoPathsInfoOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    revision: hfProps.revision(),
    paths: Property.Array({
      displayName: 'Paths',
      description: "File or folder paths inside the repository, for example 'config.json' or 'onnx/model.onnx'. Up to 2000.",
      required: true,
    }),
    expand: Property.Checkbox({
      displayName: 'Include Last Commit',
      description: 'Add the last commit and security-scan status for each path.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, revision, paths, expand } = context.propsValue;
    const pathList = hfUtils.toStringArray(paths);
    if (pathList.length === 0 || pathList.length > 2000) {
      throw new Error('Provide between 1 and 2000 paths.');
    }
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${apiPath}/paths-info/${hfRepo.encodeRevision(revision)}`,
      body: { paths: pathList, expand: expand === true },
    });
    const entries = Array.isArray(response.body) ? response.body : [];
    return { paths: entries, count: entries.length };
  },
});
