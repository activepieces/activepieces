import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubDeleteFileAction = createAction({
  auth: githubAuth,
  name: 'delete_file',
  displayName: 'Delete File (Agent)',
  description: 'Deletes a file from a repository via a commit.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a file (DELETE /repos/{owner}/{repo}/contents/{path}) by committing the removal. COMPOSITE: you must first call Get File Content on the same path to obtain the file\'s current blob "sha" and pass it here — the API rejects a delete without the correct sha. Optionally target a branch (defaults to the default branch). Destructive. Not idempotent: re-deleting a removed file returns 404.',
    idempotent: false,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    path: Property.ShortText({
      displayName: 'Path',
      description: 'File path to delete (e.g. "docs/old.md").',
      required: true,
    }),
    message: Property.ShortText({
      displayName: 'Commit Message',
      required: true,
    }),
    sha: Property.ShortText({
      displayName: 'Blob SHA',
      description:
        "The file's current blob sha — obtain it via Get File Content first.",
      required: true,
    }),
    branch: Property.ShortText({
      displayName: 'Branch',
      description: 'Branch to commit to (defaults to the default branch).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, path, message, sha, branch } = propsValue;
    const body: Record<string, unknown> = { message, sha };
    if (branch !== undefined) body['branch'] = branch;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${owner}/${repo}/contents/${path}`,
        body,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 409 || status === 422)
        throw new Error(
          `Delete failed for "${path}" — the blob sha is missing or stale. Re-read it via Get File Content.`
        );
      throw githubError(error, `Path "${path}" in ${owner}/${repo}`);
    }
  },
});
