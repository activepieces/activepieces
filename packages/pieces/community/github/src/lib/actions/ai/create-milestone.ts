import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCreateMilestoneAction = createAction({
  auth: githubAuth,
  name: 'create_milestone',
  displayName: 'Create Milestone (Agent)',
  description: 'Creates a milestone in a repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a milestone (POST /repos/{owner}/{repo}/milestones) with a title and optional description, state, and due_on date. Not idempotent: each call creates a new milestone even with an identical title.',
    idempotent: false,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    due_on: Property.ShortText({
      displayName: 'Due On',
      description: 'ISO 8601 timestamp for the due date.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, title, description, state, due_on } = propsValue;
    const body: Record<string, unknown> = { title };
    if (description !== undefined) body['description'] = description;
    if (state !== undefined) body['state'] = state;
    if (due_on !== undefined) body['due_on'] = due_on;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/milestones`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
