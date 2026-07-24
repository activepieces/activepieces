import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubAddCollaboratorAction = createAction({
  auth: githubAuth,
  name: 'add_collaborator',
  displayName: 'Add Collaborator (Agent)',
  description: 'Invites a user as a repository collaborator.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds (or invites) a user as a collaborator on a repository (PUT /repos/{owner}/{repo}/collaborators/{username}) with a permission level (pull, triage, push, maintain, admin). GRANTS ACCESS — requires repo-admin. Idempotent: re-adding with the same permission converges (a pending invite is created if the user must accept). Resolve logins via Search Users.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The user login to add. Resolve via Search Users.',
      required: true,
    }),
    permission: Property.StaticDropdown({
      displayName: 'Permission',
      required: false,
      options: {
        options: [
          { label: 'Pull (read)', value: 'pull' },
          { label: 'Triage', value: 'triage' },
          { label: 'Push (write)', value: 'push' },
          { label: 'Maintain', value: 'maintain' },
          { label: 'Admin', value: 'admin' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, username, permission } = propsValue;
    const body: Record<string, unknown> = {};
    if (permission !== undefined) body['permission'] = permission;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PUT,
        resourceUri: `/repos/${owner}/${repo}/collaborators/${username}`,
        body,
      });
      return response.body ?? { success: true, status: response.status };
    } catch (error: any) {
      throw githubError(error, `User "${username}" on ${owner}/${repo}`);
    }
  },
});
