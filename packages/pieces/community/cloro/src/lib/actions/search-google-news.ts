import { createAction, Property } from '@activepieces/pieces-framework';
import { cloroAuth } from '../auth';
import { cloroApi } from '../common/client';
import { countryProp } from '../common/props';

export const searchGoogleNewsAction = createAction({
  auth: cloroAuth,
  name: 'search_google_news',
  classification: 'SEARCH',
  displayName: 'Search Google News',
  description: 'Get the live Google News results for a search query in a country.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a live Google News search for a query in one country and returns the news articles: position, title, URL, publisher, date and snippet. Use Search Google for web pages instead of news. Uses cloro credits per call; safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The news topic to search for, for example a brand or a company name.',
      required: true,
    }),
    country: countryProp,
  },
  async run(context) {
    const result = await cloroApi.monitor({
      apiKey: context.auth.secret_text,
      path: '/v1/monitor/google/news',
      body: {
        query: context.propsValue.query.trim(),
        country: context.propsValue.country,
      },
    });
    const rows = Array.isArray(result['newsResults']) ? result['newsResults'].filter(cloroApi.isRecord) : [];
    return rows
      .filter((row) => cloroApi.isDirectLink(row['link']))
      .map((row) => ({
        position: typeof row['position'] === 'number' ? row['position'] : null,
        title: cloroApi.text(row['title']),
        url: cloroApi.text(row['link']),
        source: cloroApi.text(row['source']) || null,
        date: cloroApi.text(row['date']) || null,
        snippet: cloroApi.text(row['snippet']) || null,
      }));
  },
});
