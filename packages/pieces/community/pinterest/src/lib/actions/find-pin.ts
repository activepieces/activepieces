import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { adAccountIdDropdown } from '../common/props';
import { findPinActionOutputSchema } from '../output-schemas';

export const findPin = createAction({
  auth: pinterestAuth,
  name: 'findPin',
  classification: 'SEARCH',
  outputSchema: findPinActionOutputSchema,
  displayName: 'Find Pin by Keyword',
  description: 'Search for Pins using title, description, or keywords.',
  audience: 'both',
  aiMetadata: {
    description:
      "Searches the authenticated account's Pins by keywords matched against title, description, or tags (comma-separated pin IDs also work). Use to locate existing Pins or resolve a pin_id before deleting or referencing one. Read-only and idempotent; supports a max-results cap and pagination via a bookmark token.",
    idempotent: true,
  },
  props: {
    ad_account_id: adAccountIdDropdown,
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description:
        'Words in the title, description or tags, or comma-separated Pin IDs.',
      placeholder: 'e.g. summer salad',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description: 'Bookmark from a previous run to fetch the next page.',
      advanced: true,
    }),
    skip: Property.Number({
      displayName: 'Skip',
      required: false,
      description: 'Pins already returned from the bookmark page. Copy from the last run.',
      advanced: true,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      required: false,
      description: 'Never returns more than this many Pins.',
      defaultValue: 25,
      display: 'stepper',
      min: 1,
      max: 250,
      step: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, bookmark, ad_account_id, max_results, skip } = propsValue;
    const limit = max_results ?? DEFAULT_MAX_RESULTS;
    const skipOnFirstPage = Math.max(0, Math.floor(skip ?? 0));
    const accessToken = getAccessTokenOrThrow(auth);

    let items: unknown[] = [];
    let pageBookmark: string | undefined = bookmark || undefined;
    let nextBookmark: string | undefined = undefined;
    let lastPageStart = 0;
    let lastPageSkipped = 0;

    for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
      const params = new URLSearchParams();
      params.append('query', query);
      if (pageBookmark) {
        params.append('bookmark', pageBookmark);
      }
      if (ad_account_id) {
        params.append('ad_account_id', ad_account_id);
      }

      const response = await makeRequest(
        accessToken,
        HttpMethod.GET,
        `/search/pins?${params.toString()}`
      );

      const rawItems: unknown[] = Array.isArray(response?.items)
        ? response.items
        : [];
      const skipped = page === 0 ? Math.min(skipOnFirstPage, rawItems.length) : 0;
      const pageItems = rawItems.slice(skipped);
      lastPageStart = items.length;
      lastPageSkipped = skipped;
      items = [...items, ...pageItems];
      nextBookmark =
        typeof response?.bookmark === 'string' && response.bookmark.length > 0
          ? response.bookmark
          : undefined;

      if (!nextBookmark || items.length >= limit || rawItems.length === 0) {
        break;
      }
      pageBookmark = nextBookmark;
    }

    const cutInsidePage = items.length > limit;
    const limitedItems = cutInsidePage ? items.slice(0, limit) : items;

    return {
      items: limitedItems,
      bookmark: cutInsidePage ? pageBookmark : nextBookmark,
      skip: cutInsidePage ? lastPageSkipped + (limit - lastPageStart) : 0,
      total_results: limitedItems.length,
      query_used: query,
      has_more: cutInsidePage || !!nextBookmark,
    };
  },
});

const DEFAULT_MAX_RESULTS = 25;
const MAX_SEARCH_PAGES = 10;
