import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { listRepoFilesOutputSchema } from '../output-schemas';

export const listRepoFiles = createAction({
  auth: huggingFaceAuth,
  name: 'list_repo_files',
  classification: 'SEARCH',
  displayName: 'List Repo Files',
  description: 'List the files and folders of a model, dataset or Space repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the files and folders under a path of a Hub repository at a revision, one page per call with a next_cursor; each entry carries its type, path, size and LFS info. Use it to discover file paths before Read Repo File or Get File/Folder Info; set Recursive to walk sub-folders. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listRepoFilesOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    revision: hfProps.revision(),
    path: Property.ShortText({
      displayName: 'Folder Path',
      description: "Folder inside the repository to list, for example 'onnx' or 'data/train'. Leave empty for the root.",
      required: false,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'List every file in sub-folders too.',
      required: false,
      defaultValue: false,
    }),
    expand: Property.Checkbox({
      displayName: 'Include Last Commit',
      description: 'Add the last commit and security-scan status to each entry. Limits a page to 100 entries.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum entries in this page: up to 1000, or up to 100 when Include Last Commit is on.',
      required: false,
    }),
    cursor: hfProps.cursor(),
  },
  async run(context) {
    const { repo_type, repo_id, revision, path, recursive, expand, limit, cursor } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: expand ? 100 : 1000, name: 'Limit' });
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const encodedPath = hfRepo.encodeFilePath(path);
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/tree/${hfRepo.encodeRevision(revision)}${encodedPath ? `/${encodedPath}` : ''}`,
      query: [
        ['recursive', recursive ? 'true' : undefined],
        ['expand', expand ? 'true' : undefined],
        ['limit', limit],
        ['cursor', cursor],
      ],
    });
    const files = Array.isArray(response.body) ? response.body : [];
    return {
      files,
      count: files.length,
      next_cursor: hfHub.parseNextCursor(response.headers),
    };
  },
});
