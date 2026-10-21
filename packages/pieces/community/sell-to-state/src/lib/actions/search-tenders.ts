import { createAction, Property } from '@activepieces/pieces-framework';
import { sellToStateAuth } from '../common/auth';
import { SearchResult, stsGet } from '../common/client';

export const searchTenders = createAction({
  auth: sellToStateAuth,
  name: 'search_tenders',
  classification: 'SEARCH',
  displayName: 'Search Tenders',
  description: 'Searches government tenders and contract awards by text and country.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search government tenders and awards from official procurement sources in 60+ countries by text, country and lifecycle. Use "Accepts Bids Only" to find tenders that a supplier can still bid on. Read-only, safe to retry.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({
      displayName: 'Text',
      description: 'Words in the tender title, at most 120 characters. Example: payroll software.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description:
        'Country slug, or slugs separated by commas, for example "united-kingdom,ireland". Empty means all countries.',
      required: false,
    }),
    acceptsBids: Property.Checkbox({
      displayName: 'Accepts Bids Only',
      description: 'Only open tenders whose bid deadline is in the future.',
      required: false,
      defaultValue: false,
    }),
    lifecycle: Property.StaticDropdown({
      displayName: 'Lifecycle',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'open' },
          { label: 'Awarded', value: 'awarded' },
          { label: 'Planned', value: 'planned' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      defaultValue: 'relevance',
      options: {
        options: [
          { label: 'Relevance', value: 'relevance' },
          { label: 'Nearest deadline', value: 'deadline' },
          { label: 'Newest published', value: 'published_desc' },
          { label: 'Newest in Sell to State', value: 'added_desc' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Results to return, 1 to 50.',
      required: false,
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    const result = await stsGet<SearchResult>({
      apiKey: auth.secret_text,
      path: '/search',
      query: {
        scope: 'tenders',
        q: propsValue.q,
        country: propsValue.country,
        accepts_bids: propsValue.acceptsBids ? 'true' : undefined,
        lifecycle: propsValue.lifecycle,
        sort: propsValue.sort,
        per_page: Math.min(Math.max(propsValue.limit ?? 25, 1), 50),
      },
    });
    return { found: result.found, tenders: result.hits };
  },
});
