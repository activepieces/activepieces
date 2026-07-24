import { createAction, Property } from '@activepieces/pieces-framework';
import { githubAuth } from '../../auth';
import { githubPaginatedApiCall, RequestParams } from '../../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ownerProp, repoProp, githubError } from './common';

export const githubListCommitsAction = createAction({
  auth: githubAuth,
  name: 'list_commits',
  displayName: 'List Commits (Agent)',
  description: 'Lists commits in a repository with optional filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists commits in a repository (GET /repos/{owner}/{repo}/commits) filtered by sha (branch or ref to start from), path, author, and since/until ISO 8601 timestamps. Returns all pages. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    owner: ownerProp,
    repo: repoProp,
    sha: Property.ShortText({
      displayName: 'SHA or Branch',
      description: 'Branch name or commit SHA to start listing from.',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'Only commits touching this file path.',
      required: false,
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: 'Filter by author login or email.',
      required: false,
    }),
    since: Property.ShortText({
      displayName: 'Since',
      description: 'ISO 8601 timestamp lower bound.',
      required: false,
    }),
    until: Property.ShortText({
      displayName: 'Until',
      description: 'ISO 8601 timestamp upper bound.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { owner, repo } = propsValue;
    const query: RequestParams = {};
    if (propsValue.sha) query['sha'] = propsValue.sha;
    if (propsValue.path) query['path'] = propsValue.path;
    if (propsValue.author) query['author'] = propsValue.author;
    if (propsValue.since) query['since'] = propsValue.since;
    if (propsValue.until) query['until'] = propsValue.until;
    try {
      const items = await githubPaginatedApiCall<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        resourceUri: `/repos/${owner}/${repo}/commits`,
        query,
      });
      return { items, count: items.length };
    } catch (error: any) {
      throw githubError(error, `Repository ${owner}/${repo}`);
    }
  },
});
