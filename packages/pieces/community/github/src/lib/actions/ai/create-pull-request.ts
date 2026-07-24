import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubApiCall } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubCreatePullRequestAction = createAction({
  auth: githubAuth,
  name: 'create_pull_request',
  displayName: 'Create Pull Request (Agent)',
  description: 'Opens a pull request between two branches.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Opens a pull request (POST /repos/{owner}/{repo}/pulls) from the head branch into the base branch, with a title and optional body. Set draft=true for a draft PR. For cross-fork PRs prefix head with the fork owner ("owner:branch"). Resolve branch names via List Branches. Not idempotent: each call opens a new PR.',
    idempotent: false,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    head: Property.ShortText({
      displayName: 'Head Branch',
      description:
        'The branch with your changes (e.g. "feature/x"). For a fork use "fork-owner:branch".',
      required: true,
    }),
    base: Property.ShortText({
      displayName: 'Base Branch',
      description: 'The branch to merge into (e.g. "main").',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Body',
      required: false,
    }),
    draft: Property.Checkbox({
      displayName: 'Draft',
      description: 'Open as a draft pull request.',
      required: false,
    }),
    maintainer_can_modify: Property.Checkbox({
      displayName: 'Maintainer Can Modify',
      description: 'Allow maintainers to edit the head branch.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      owner,
      repo,
      title,
      head,
      base,
      body,
      draft,
      maintainer_can_modify,
    } = propsValue;
    const requestBody: Record<string, unknown> = { title, head, base };
    if (body !== undefined) requestBody['body'] = body;
    if (draft !== undefined) requestBody['draft'] = draft;
    if (maintainer_can_modify !== undefined)
      requestBody['maintainer_can_modify'] = maintainer_can_modify;
    try {
      const response = await githubApiCall({
        auth,
        method: HttpMethod.POST,
        resourceUri: `/repos/${owner}/${repo}/pulls`,
        body: requestBody,
      });
      return response.body;
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
