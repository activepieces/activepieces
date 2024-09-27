import { Octokit } from 'octokit';
import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';

export const githubUnlockIssueAction = createAction({
  auth: githubAuth,
  name: 'unlockIssue',
  displayName: 'Unlock issue',
  description: 'Unlocks the specified issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue to be unlocked',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { issue_number } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const client = new Octokit({ auth: auth.access_token });
    return await client.rest.issues.unlock({
      owner,
      repo,
      issue_number,
    });
  },
});
