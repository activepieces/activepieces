import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCreateOrUpdateFileAction = createAction({
  auth: githubAuth,
  name: 'create_or_update_file',
  displayName: 'Create or Update File (Agent)',
  description: 'Creates or updates a single file via a commit.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates or updates a file (PUT /repos/{owner}/{repo}/contents/{path}) by committing base64 content with a commit message. To UPDATE an existing file you MUST pass its current blob "sha" (obtain it via Get File Content) — without the sha GitHub returns 422. To create a new file, omit the sha. Optionally target a branch (defaults to the default branch). Idempotent: writing the same content/sha converges to the same file state.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    path: Property.ShortText({
      displayName: 'Path',
      description: 'File path within the repo (e.g. "docs/readme.md").',
      required: true,
    }),
    message: Property.ShortText({
      displayName: 'Commit Message',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content (base64)',
      description: 'The new file content, base64-encoded.',
      required: true,
    }),
    sha: Property.ShortText({
      displayName: 'Blob SHA',
      description:
        'REQUIRED when updating an existing file — its current blob sha from Get File Content. Omit to create a new file.',
      required: false,
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'Branch to commit to (defaults to the default branch).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, path, message, content, sha, branch } = propsValue;
    const body: Record<string, unknown> = { message, content };
    if (sha !== undefined) body['sha'] = sha;
    if (branch !== undefined) body['branch'] = branch;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PUT,
        resourceUri: `/repos/${owner}/${repo}/contents/${path
          .split('/')
          .map(encodeURIComponent)
          .join('/')}`,
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 422)
        throw new Error(
          `Update failed for "${path}" — when updating an existing file you must pass its current blob sha (get it from Get File Content).`
        );
      throw githubError(error, `Path "${path}" in ${owner}/${repo}`);
    }
  },
});
