import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { listDiscussionsOutputSchema } from '../output-schemas';

export const listDiscussions = createAction({
  auth: huggingFaceAuth,
  name: 'list_discussions',
  classification: 'SEARCH',
  displayName: 'List Discussions & PRs',
  description: 'List the discussions and pull requests of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the discussions and pull requests of a model, dataset or Space repository, one page per call (page-number pagination with next_page), filterable by kind, status, author and text search. Each entry carries its per-repository number, which Get Discussion or PR needs. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listDiscussionsOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    kind: Property.StaticDropdown({
      displayName: 'Kind',
      description: 'Only discussions, only pull requests, or both. Defaults to both.',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Discussions', value: 'discussion' },
          { label: 'Pull Requests', value: 'pull_request' },
        ],
      },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only open, only closed, or both. Defaults to both.',
      required: false,
      defaultValue: 'all',
      options: {
        disabled: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    author: Property.ShortText({
      displayName: 'Author',
      description: "Only threads opened by this Hub username, for example 'julien-c'.",
      required: false,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Only threads whose title matches this text.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sort order. Defaults to most recently created.',
      required: false,
      defaultValue: 'recently-created',
      options: {
        disabled: false,
        options: [
          { label: 'Recently Created', value: 'recently-created' },
          { label: 'Trending', value: 'trending' },
          { label: 'Most Reactions', value: 'reactions' },
        ],
      },
    }),
    page: hfProps.page(),
  },
  async run(context) {
    const { repo_type, repo_id, kind, status, author, search, sort, page } = context.propsValue;
    hfUtils.assertLimit({ value: page, min: 0, max: Number.MAX_SAFE_INTEGER, name: 'Page' });
    const token = context.auth.secret_text;
    const pageNumber = page ?? 0;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/discussions`,
      query: [
        ['p', pageNumber],
        ['type', kind],
        ['status', status],
        ['author', author],
        ['search', search],
        ['sort', sort],
      ],
    });
    const body = hfHub.isRecord(response.body) ? response.body : {};
    const discussions = Array.isArray(body['discussions']) ? body['discussions'] : [];
    const totalCount = typeof body['count'] === 'number' ? body['count'] : null;
    const start = typeof body['start'] === 'number' ? body['start'] : 0;
    const hasMore = totalCount !== null && start + discussions.length < totalCount;
    return {
      discussions,
      count: discussions.length,
      total_count: totalCount,
      page: pageNumber,
      next_page: hasMore ? pageNumber + 1 : null,
    };
  },
});
