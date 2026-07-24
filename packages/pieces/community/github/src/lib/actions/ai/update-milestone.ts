import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubUpdateMilestoneAction = createAction({
  auth: githubAuth,
  name: 'update_milestone',
  displayName: 'Update Milestone (Agent)',
  description: 'Updates a milestone, including closing or reopening it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a milestone (PATCH /repos/{owner}/{repo}/milestones/{milestone_number}), setting only the fields you provide — title, state (open/closed), description, or due_on. Resolve the number via List Milestones. Idempotent: applying the same values again leaves the milestone in the same state.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    milestone_number: Property.Number({
      displayName: 'Milestone Number',
      description: 'The milestone number. Resolve via List Milestones.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
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
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due On',
      description: 'ISO 8601 timestamp for the due date.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, milestone_number } = propsValue;
    const body: Record<string, unknown> = {};
    if (propsValue.title !== undefined) body['title'] = propsValue.title;
    if (propsValue.state !== undefined) body['state'] = propsValue.state;
    if (propsValue.description !== undefined)
      body['description'] = propsValue.description;
    if (propsValue.due_on !== undefined) body['due_on'] = propsValue.due_on;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.PATCH,
        resourceUri: `/repos/${owner}/${repo}/milestones/${milestone_number}`,
        body,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(
        error,
        `Milestone ${milestone_number} in ${owner}/${repo}`
      );
    }
  },
});
