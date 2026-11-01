import { githubAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { issueActionOutputSchema } from '../output-schemas';

export const githubGetIssueInformation = createAction({
  auth: githubAuth,
  name: 'getIssueInformation',
  classification: 'READ',
  displayName: 'Get Issue Information',
  description: "Gets an issue's details by its number.",
  audience: 'human',
  aiMetadata: {
    description:
      'Fetches the full details of a single issue in a repository by its issue number. Use when you already know the issue number and need its current state, title, body, labels, or assignees. Read-only and idempotent.',
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
  outputSchema: issueActionOutputSchema,
  async run({ auth, propsValue }) {
    const issue_number = propsValue.issue_number;
    const { owner, repo } = propsValue.repository!;

    const response = await githubApiCall({
      auth,
      method: HttpMethod.GET,
      resourceUri: `/repos/${owner}/${repo}/issues/${issue_number}`,
    });

    return response;
  },
});
