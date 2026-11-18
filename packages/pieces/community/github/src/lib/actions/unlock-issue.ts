import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubUnlockIssueAction = createAction({
  auth: githubAuth,
  name: 'unlockIssue',
  classification: 'WRITE',
  displayName: 'Unlock Issue',
  description: 'Lets everyone comment on a locked issue again.',
  audience: 'human',
  aiMetadata: {
    description:
      'Removes the conversation lock from an issue (by number) so anyone can comment again. Use to re-open discussion on a previously locked issue or pull request. Idempotent: unlocking an already-unlocked issue leaves it unlocked.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'issue',
      display: 'section',
      label: 'Issue',
      icon: 'inbox',
      props: ['repository', 'issue_number'],
    },
  ],
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number shown after # on GitHub.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { issue_number } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.DELETE,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}/lock`,
    });

    return response;
  },
});
