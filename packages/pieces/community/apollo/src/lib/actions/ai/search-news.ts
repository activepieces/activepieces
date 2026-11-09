import { createAction } from '@activepieces/pieces-framework';
import { apolloAuth } from '../../auth';
import { apiKeyOf, recordsOf } from '../../common/client';
import { aiProps, apolloInputs } from '../../common/ai-props';
import { apolloOutputSchemas } from '../../common/output-schemas';
import { apolloMappers, apolloRequests } from '../../common/requests';

export const aiSearchNewsAction = createAction({
  auth: apolloAuth,
  name: 'ai_search_news',
  classification: 'SEARCH',
  displayName: 'Search News Articles',
  description: 'Search news articles about companies.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches news articles (hires, funding, contracts and more) about one or more companies by Apollo organization ID from Search Organizations, optionally by category and published-date range, up to 25 per page. Costs 1 Apollo credit per page.',
    idempotent: true,
  },
  props: {
    organization_ids: aiProps.textList({ displayName: 'Organization IDs', description: 'Apollo organization IDs from Search Organizations (field organization_id).', required: true }),
    categories: aiProps.textList({ displayName: 'Categories', description: 'News categories, e.g. hires, investment, contract.', required: false }),
    published_after: aiProps.text({ displayName: 'Published On or After', description: 'Earliest publish date, YYYY-MM-DD.', required: false }),
    published_before: aiProps.text({ displayName: 'Published On or Before', description: 'Latest publish date, YYYY-MM-DD.', required: false }),
    page: aiProps.page(),
    per_page: aiProps.perPage({ max: 25, fallback: 10 }),
  },
  outputSchema: apolloOutputSchemas.newsSearch,
  async run({ propsValue, auth }) {
    const { page, perPage } = apolloInputs.pageParams({ page: propsValue.page, perPage: propsValue.per_page, maxPerPage: 25, defaultPerPage: 10 });
    const after = apolloInputs.ymdDate({ value: propsValue.published_after, label: 'Published On or After' });
    const before = apolloInputs.ymdDate({ value: propsValue.published_before, label: 'Published On or Before' });
    if (after !== undefined && before !== undefined && after > before) {
      throw new Error('Published On or After must not be later than Published On or Before.');
    }
    const body = await apolloRequests.searchNews({
      apiKey: apiKeyOf(auth),
      query: {
        'organization_ids[]': apolloInputs.requireStringList({ value: propsValue.organization_ids, label: 'Organization IDs', max: 1000 }),
        'categories[]': apolloInputs.stringList(propsValue.categories),
        'published_at[min]': after,
        'published_at[max]': before,
        page,
        per_page: perPage,
      },
    });
    const articles = recordsOf(body['news_articles']).map((article) => apolloMappers.newsArticle(article));
    return { ...apolloMappers.pageInfo({ body, page, perPage, returned: articles.length }), articles };
  },
});
