import { Octokit } from 'octokit';
import { githubAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';

export const githubGetIssueInformation = createAction({
  auth: githubAuth,
  name: 'getIssueInformation',
  displayName: 'Get issue information',
  description: 'Grabs information from a specific issue',
  props: {
    repository: githubCommon.repositoryDropdown,
    issue_number: Property.Number({
      displayName: 'Issue Number',
      description: 'The number of the issue you want to get information from',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;
    const client = new Octokit({ auth: auth.access_token });
    return await client.rest.issues.get({
      owner,
      repo,
      issue_number,
    });

  },
});
