import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubGetMilestoneAction = createAction({
  auth: githubAuth,
  name: 'get_milestone',
  displayName: 'Get Milestone (Agent)',
  description: 'Fetches a single milestone by number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches a single milestone (GET /repos/{owner}/{repo}/milestones/{milestone_number}) including its open/closed issue counts. Resolve the number via List Milestones. Read-only and idempotent.',
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
  },
  async run({ auth, propsValue }) {
    const { owner, repo, milestone_number } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/milestones/${milestone_number}`,
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
