import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { searchPinsOperation } from '../common/operations';
import { findPinActionOutputSchema } from '../output-schemas';

export const searchPins = createAction({
  auth: pinterestAuth,
  name: 'searchPins',
  classification: 'SEARCH',
  outputSchema: findPinActionOutputSchema,
  displayName: 'Search Pins',
  description: "Search the account's Pins by text.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches the connected account's own Pins by text matched against titles, descriptions and tags, and returns the matches with their pin ids. Use it to resolve a Pin before reading, updating or deleting it; use List Pins on Board when the board is known. Only this account's Pins are searched, and paging uses an opaque bookmark cursor rather than a page size. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      required: true,
      description:
        'Text to match against Pin titles, descriptions and tags. Comma-separated pin ids also work.',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      required: false,
      description:
        'Trim the returned page to at most this many Pins. Pinterest has no page-size parameter for Pin search, so this only shortens the response.',
    }),
  },
  async run({ auth, propsValue }) {
    return await searchPinsOperation({
      accessToken: getAccessTokenOrThrow(auth),
      query: propsValue.query,
      bookmark: propsValue.bookmark,
      max_results: propsValue.max_results,
    });
  },
});
