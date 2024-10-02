import { Octokit } from 'octokit';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../';
import { githubCommon } from '../common';

export const githubCreateIssueAction = createAction({
  auth: githubAuth,
  name: 'github_create_issue',
  displayName: 'Create Issue',
  description: 'Create Issue in GitHub Repository',
  props: {
    repository: githubCommon.repositoryDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the issue',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the issue',
      required: false,
    }),
    labels: githubCommon.labelDropDown(),
    assignees: githubCommon.assigneeDropDown(),
  },
  async run({ auth, propsValue }) {
    const { title, assignees, labels, description } = propsValue;
    const { owner, repo } = propsValue.repository!;

    const client = new Octokit({ auth: auth.access_token });
    return await client.rest.issues.create({
      owner,
      repo,
      title,
      body: description,
      labels,
      assignees,
    });
  },
});
