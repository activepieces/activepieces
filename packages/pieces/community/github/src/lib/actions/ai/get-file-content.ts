import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetFileContentAction = createAction({
  auth: githubAuth,
  name: 'get_file_content',
  displayName: 'Get File Content (Agent)',
  description: 'Reads a file (or directory listing) from a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads repository contents at a path (GET /repos/{owner}/{repo}/contents/{path}). For a file it returns base64 content plus the blob "sha" — that sha is REQUIRED to update an existing file (Create or Update File) or to delete it (Delete File). For a directory path it returns the listing. Optionally pin to a ref (branch/tag/SHA). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'File or directory path within the repo (e.g. "src/index.ts").',
      required: true,
    }),
    ref: Property.ShortText({
      displayName: 'Ref',
      description:
        'Optional branch, tag, or commit SHA (defaults to the default branch).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, path, ref } = propsValue;
    const query: RequestParams = {};
    if (ref) query['ref'] = ref;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/contents/${path}`,
        query,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Path "${path}" in ${owner}/${repo}`);
    }
  },
});
