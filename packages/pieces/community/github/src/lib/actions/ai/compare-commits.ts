import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCompareCommitsAction = createAction({
  auth: githubAuth,
  name: 'compare_commits',
  displayName: 'Compare Commits (Agent)',
  description: 'Compares two commits, branches, or tags.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Compares two refs (GET /repos/{owner}/{repo}/compare/{base}...{head}) and returns how far ahead/behind head is plus the changed files. Base and head can each be a branch, tag, or commit SHA. Resolve refs via List Branches or List Commits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    base: Property.ShortText({
      displayName: 'Base',
      description: 'The base ref (branch, tag, or SHA).',
      required: true,
    }),
    head: Property.ShortText({
      displayName: 'Head',
      description: 'The head ref to compare against the base.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo, base, head } = propsValue;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/compare/${base}...${head}`,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(
        error,
        `Comparison ${base}...${head} in ${owner}/${repo}`
      );
    }
  },
});
