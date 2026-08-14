import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubRemoveCollaboratorAction = createAction({
  auth: githubAuth,
  name: 'remove_collaborator',
  displayName: 'Remove Collaborator (Agent)',
  description: "Revokes a user's collaborator access to a repository.",
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a collaborator from a repository (DELETE /repos/{owner}/{repo}/collaborators/{username}). REVOKES ACCESS — requires repo-admin. Idempotent: removing a user who is not a collaborator ends in the same state. Resolve current collaborators via List Collaborators.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    username: Property.ShortText({
      displayName: 'Username',
      description: 'The user login to remove. Resolve via List Collaborators.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, username } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${owner}/${repo}/collaborators/${username}`,
      });
      return { success: true, status: response.status, removed: username };
    } catch (error: any) {
      throw githubError(error, `User "${username}" on ${owner}/${repo}`);
    }
  },
});
