import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubCreateIssueAiAction = createAction({
  auth: githubAuth,
  name: 'create_issue_ai',
  displayName: 'Create Issue (Agent)',
  description: 'Opens a new issue in a GitHub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Opens a new issue in a GitHub repository (POST /repos/{owner}/{repo}/issues) with a title and optional body, labels, and assignees. Resolve owner/repo via List My Repositories or Search Repositories. Not idempotent: each call creates a separate issue even with identical input.',
    idempotent: false,
  },
  props: {
    owner: Property.ShortText({
      displayName: 'Owner',
      description:
        'Repository owner login (user or org). Resolve via List My Repositories or Search Repositories.',
      required: true,
    }),
    repo: Property.ShortText({
      displayName: 'Repository',
      description: 'Repository name (without the owner prefix).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the issue.',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'The body/description of the issue.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      description: 'Label names to attach. Resolve via List Repository Labels.',
      required: false,
    }),
    assignees: Property.Array({
      displayName: 'Assignees',
      description: 'User logins to assign. Resolve via List Assignees.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, title, body, labels, assignees } = propsValue;

    const issueFields: Record<string, unknown> = { title };
    if (body !== undefined) issueFields['body'] = body;
    if (labels && (labels as string[]).length > 0)
      issueFields['labels'] = labels as string[];
    if (assignees && (assignees as string[]).length > 0)
      issueFields['assignees'] = assignees as string[];

    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/issues`,
        body: issueFields,
      });
      return response.body;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 404)
        throw new Error(
          `Repository ${owner}/${repo} not found, or you lack access.`
        );
      if (status === 403)
        throw new Error(
          'Permission denied creating the issue (check repo write access / token scope).'
        );
      if (status === 410)
        throw new Error('Issues are disabled for this repository.');
      throw error;
    }
  },
});
