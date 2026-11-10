import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dappierAuth } from '../..';
import { dappierCommon } from '../common';

export const sportsNewsSearch = createAction({
  name: 'sports_news_search', 
  classification: 'SEARCH',
  auth: dappierAuth,
  displayName: 'Sports News',
  description:
    'Find articles from Sportsnaut, Forever Blueshirts and other sports sites.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Dappier sports-news sources for articles matching a natural-language query or URL. Choose this for sports-specific content rather than the general web search action. Optionally tune result count, restrict to a preferred domain, and pick the search algorithm (semantic, most recent, most recent + semantic, or trending) to control whether matching is contextual or recency-driven. Read-only and safe to repeat.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'text',
      props: ['query', 'search_algorithm', 'similarity_top_k'],
    },
    {
      key: 'preferred_site',
      display: 'section',
      label: 'Preferred Site',
      icon: 'filter',
      props: ['ref', 'num_articles_ref', 'preferred_site_info'],
    },
  ],
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'A question, keywords or an article URL.',
      placeholder: 'Latest NBA trade news',
      required: true,
    }),
    search_algorithm: Property.StaticDropdown({
      displayName: 'Ranking',
      description: 'How articles are matched and ordered.',
      required: false,
      options: {
        options: [
          { label: 'Most Relevant', value: 'semantic' },
          { label: 'Newest First', value: 'most_recent' },
          { label: 'Most Relevant, Newest First', value: 'most_recent_semantic' },
          { label: 'Trending in the Last 24 Hours', value: 'trending' },
        ],
      },
    }),
    similarity_top_k: Property.Number({
      displayName: 'Number of Results',
      description: 'How many articles to return. Empty: 9.',
      required: false,
    }),
    ref: Property.ShortText({
      displayName: 'Site Domain',
      description: 'Without https://.',
      placeholder: 'sportsnaut.com',
      required: false,
      width: 'half',
    }),
    num_articles_ref: Property.Number({
      displayName: 'Minimum Articles',
      description: 'From this site. Empty: 0.',
      required: false,
      width: 'half',
    }),
    preferred_site_info: Property.MarkDown({
      value:
        'Set Minimum Articles to guarantee that many results from this site. The rest come from other sites.',
      variant: MarkdownVariant.TIP,
    }),
  },
  async run({ propsValue, auth }) {
    const res = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${dappierCommon.baseUrl}/app/v2/search?data_model_id=dm_01j0pb465keqmatq9k83dthx34`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
        'Content-Type': 'application/json',
      },
      body: {
        query: propsValue.query,
        similarity_top_k: propsValue.similarity_top_k,
        ref: propsValue.ref,
        num_articles_ref: propsValue.num_articles_ref,
        search_algorithm: propsValue.search_algorithm,
      },
    });

    return res.body;
  },
});
