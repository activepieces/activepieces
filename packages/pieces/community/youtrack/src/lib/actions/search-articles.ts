import { createAction, Property } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { ARTICLE_FIELDS, articleRow, LIST_LIMIT_DEFAULT, LIST_LIMIT_MAX } from '../common';
import { youtrackClient } from '../common/client';
import { searchArticlesActionOutputSchema } from '../output-schemas';

export const searchArticlesAction = createAction({
  auth: youtrackAuth,
  name: 'search_articles',
  classification: 'SEARCH',
  outputSchema: searchArticlesActionOutputSchema,
  displayName: 'Search Articles',
  description: 'Searches Knowledge Base articles.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search YouTrack Knowledge Base articles by text (leave empty to list articles), returning ID, readable ID, summary, project, parent article, reporter and timestamps (no content; use Get Article for the content). Returns items plus hasMore. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Search', description: 'Words to search for in articles. Leave empty to list articles.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: `Max articles to return (1-${LIST_LIMIT_MAX}). Default ${LIST_LIMIT_DEFAULT}.`, required: false }),
    skip: Property.Number({ displayName: 'Skip', description: 'Number of articles to skip. Default 0.', required: false }),
  },
  async run(context) {
    const search = youtrackClient.optionalText(context.propsValue.query);
    const { items, hasMore } = await youtrackClient.listPage({
      auth: context.auth,
      path: '/articles',
      query: { fields: search === undefined ? ARTICLE_FIELDS : `${ARTICLE_FIELDS},content`, query: search },
      limit: youtrackClient.boundedLimit({ value: context.propsValue.limit, fallback: LIST_LIMIT_DEFAULT, max: LIST_LIMIT_MAX }),
      skip: context.propsValue.skip,
      operation: 'search articles',
    });
    const matching = items.filter((row) => youtrackClient.matchesSearchText({ row, text: search, keys: ['summary', 'content', 'idReadable'] }));
    return { items: matching.map(articleRow), hasMore };
  },
});
