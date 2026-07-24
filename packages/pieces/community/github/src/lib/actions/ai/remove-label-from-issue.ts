import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubRemoveLabelFromIssueAction = createAction({
  auth: githubAuth,
  name: 'remove_label_from_issue',
  displayName: 'Remove Label from Issue (Agent)',
  description: 'Detaches a single label from an issue or pull request.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one label by name from an issue (DELETE /repos/{owner}/{repo}/issues/{issue_number}/labels/{name}). Use Add Labels to Issue to attach or Set Issue Labels to replace the whole set. Works on pull request numbers too. Resolve current labels via List Issue Labels. Idempotent: a label that is already absent ends up absent (404 if it was never present).',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description:
        'The issue or pull request number. Resolve via List Repository Issues.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Label Name',
      description:
        'The label to remove. Resolve current labels via List Issue Labels.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, issue_number, name } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/labels/${encodeURIComponent(
          name
        )}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(
        error,
        `Label "${name}" on issue #${issue_number} in ${owner}/${repo}`
      );
    }
  },
});
