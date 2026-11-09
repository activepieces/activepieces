import { createAction, Property } from '@activepieces/pieces-framework';
import { cloroAuth } from '../auth';
import { cloroApi } from '../common/client';
import { countryProp } from '../common/props';

export const searchGoogleAction = createAction({
  auth: cloroAuth,
  name: 'search_google',
  classification: 'SEARCH',
  displayName: 'Search Google',
  description: 'Get the live Google organic results for a search query in a country.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a live Google search for a query in one country and returns the organic results of the first page: position, title, URL, displayed link, snippet and date. Use Search Google News for news articles, and Get AI Answer for the Google AI Overview or an AI engine answer. Uses 5 cloro credits per call; safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What to search for, as you would type it into Google.',
      required: true,
    }),
    country: countryProp,
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'The maximum number of organic results to return, from 1 to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const result = await cloroApi.monitor({
      apiKey: context.auth.secret_text,
      path: '/v1/monitor/google',
      body: {
        query: context.propsValue.query.trim(),
        country: context.propsValue.country,
      },
    });
    const limit = clampResults(context.propsValue.max_results);
    const rows = Array.isArray(result['organicResults']) ? result['organicResults'].filter(cloroApi.isRecord) : [];
    return rows
      .filter((row) => cloroApi.isDirectLink(row['link']))
      .slice(0, limit)
      .map((row) => ({
        position: typeof row['position'] === 'number' ? row['position'] : null,
        title: cloroApi.text(row['title']),
        url: cloroApi.text(row['link']),
        displayed_link: cloroApi.text(row['displayedLink']) || null,
        snippet: cloroApi.text(row['snippet']) || null,
        date: cloroApi.text(row['date']) || null,
      }));
  },
});

function clampResults(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 10;
  }
  return Math.min(10, Math.max(1, Math.floor(value)));
}
