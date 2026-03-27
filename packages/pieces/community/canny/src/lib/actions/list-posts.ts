import { createAction, Property } from '@activepieces/pieces-framework';

import { cannyAuth } from '../auth';
import { cannyRequest, cleanBody } from '../common/client';

export const listPostsAction = createAction({
  auth: cannyAuth,
  name: 'list_posts',
  displayName: 'List Posts',
  description: 'Returns a list of posts for a board, with optional filtering and sorting.',
  props: {
    boardID: Property.Dropdown({
      auth: cannyAuth,
      displayName: 'Board',
      description: 'The board to list posts for (optional — omit to list across all boards).',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Canny account first.',
            options: [],
          };
        }

        const response = await cannyRequest<{
          boards: Array<{ id: string; name: string }>;
        }>({
          apiKey: auth.secret_text,
          path: '/boards/list',
        });

        return {
          disabled: false,
          options: (response.boards ?? []).map((b) => ({
            label: b.name,
            value: b.id,
          })),
        };
      },
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'A search query to filter posts.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      description: 'The order of returned posts.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Newest', value: 'newest' },
          { label: 'Oldest', value: 'oldest' },
          { label: 'Score', value: 'score' },
          { label: 'Trending', value: 'trending' },
          { label: 'Status Changed', value: 'statusChanged' },
        ],
      },
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Comma-separated list of statuses to filter by (e.g. "open,planned").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of posts to fetch (default 10).',
      required: false,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      description: 'Number of posts to skip (for pagination).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return await cannyRequest({
      apiKey: auth.secret_text,
      path: '/posts/list',
      body: cleanBody({
        boardID: propsValue.boardID,
        search: propsValue.search,
        sort: propsValue.sort,
        status: propsValue.status,
        limit: propsValue.limit,
        skip: propsValue.skip,
      }),
    });
  },
});
