import { createAction, Property } from '@activepieces/pieces-framework';
import { isRecord, makeRequest } from '../common';
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
      "Searches the authenticated account's Pins by keywords matched against title, description, or tags (comma-separated pin IDs also work). Use to locate existing Pins or resolve a pin_id before deleting or referencing one. Read-only and idempotent; it returns at most max_results Pins, and the next batch is fetched by passing the returned bookmark back as bookmark.",
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
      description: 'Bookmark from a previous run to continue where it stopped.',
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
    const { query, bookmark, ad_account_id, max_results } = propsValue;
    const limit = Math.min(
      250,
      Math.max(1, Math.floor(max_results ?? DEFAULT_MAX_RESULTS))
    );
    const cursor = decodeCursor(bookmark);
    const accessToken = getAccessTokenOrThrow(auth);

    let items: unknown[] = [];
    let pageBookmark: string | null = cursor.bookmark;
    let requestedBookmark: string | null = cursor.bookmark;
    let nextBookmark: string | undefined = undefined;
    let lastPageStart = 0;
    let lastPageSkipped = 0;

    for (let page = 0; page < MAX_SEARCH_PAGES; page++) {
      const params = new URLSearchParams();
      params.append('query', query);
      if (pageBookmark !== null) {
        params.append('bookmark', pageBookmark);
      }
      if (ad_account_id) {
        params.append('ad_account_id', ad_account_id);
      }

      const response: unknown = await makeRequest(
        accessToken,
        HttpMethod.GET,
        `/search/pins?${params.toString()}`
      );

      if (!isRecord(response) || !Array.isArray(response['items'])) {
        throw new Error(
          'Pinterest returned an unexpected response for the Pin search'
        );
      }

      const rawItems: unknown[] = response['items'];

      if (page === 0 && cursor.skip > rawItems.length) {
        throw new Error(
          'Bookmark does not match this search. Start again without a bookmark.'
        );
      }

      const skipped = page === 0 ? cursor.skip : 0;
      const responseBookmark = response['bookmark'];

      requestedBookmark = pageBookmark;
      lastPageStart = items.length;
      lastPageSkipped = skipped;
      items = [...items, ...rawItems.slice(skipped)];
      nextBookmark =
        typeof responseBookmark === 'string' && responseBookmark.length > 0
          ? responseBookmark
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
      bookmark: cutInsidePage
        ? encodeCursor({
            bookmark: requestedBookmark,
            skip: lastPageSkipped + (limit - lastPageStart),
          })
        : nextBookmark,
      total_results: limitedItems.length,
      query_used: query,
      has_more: cutInsidePage || !!nextBookmark,
    };
  },
});

function encodeCursor({
  bookmark,
  skip,
}: {
  bookmark: string | null;
  skip: number;
}): string {
  const payload = JSON.stringify({ b: bookmark, s: skip });
  return `${CURSOR_PREFIX}${Buffer.from(payload, 'utf8').toString('base64url')}`;
}

function decodeCursor(value: string | undefined): {
  bookmark: string | null;
  skip: number;
} {
  if (!value) {
    return { bookmark: null, skip: 0 };
  }

  if (!value.startsWith(CURSOR_PREFIX)) {
    return { bookmark: value, skip: 0 };
  }

  const decoded = parseCursorPayload(value.slice(CURSOR_PREFIX.length));

  if (!isRecord(decoded)) {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  const cursorBookmark = decoded['b'];
  const cursorSkip = decoded['s'];

  if (cursorBookmark !== null && typeof cursorBookmark !== 'string') {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  if (
    typeof cursorSkip !== 'number' ||
    !Number.isInteger(cursorSkip) ||
    cursorSkip < 0
  ) {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }

  return { bookmark: cursorBookmark, skip: cursorSkip };
}

function parseCursorPayload(encoded: string): unknown {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  } catch {
    throw new Error(INVALID_CURSOR_MESSAGE);
  }
}

const DEFAULT_MAX_RESULTS = 25;
const MAX_SEARCH_PAGES = 10;
const CURSOR_PREFIX = 'apc1.';
const INVALID_CURSOR_MESSAGE = 'Bookmark is not a valid Find Pin bookmark';
