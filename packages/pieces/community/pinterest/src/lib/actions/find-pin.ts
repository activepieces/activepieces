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
    max_results: Property.Number({
      displayName: 'Max Results',
      required: false,
      description: 'Pins to return from the first page of results.',
      defaultValue: 25,
      display: 'stepper',
      min: 1,
      max: 250,
      step: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const { query, bookmark, ad_account_id, max_results } = propsValue;

    const params = new URLSearchParams();
    params.append('query', query);

    if (bookmark) {
      params.append('bookmark', bookmark);
    }

    if (ad_account_id) {
      params.append('ad_account_id', ad_account_id);
    }

    const path = `/search/pins?${params.toString()}`;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      path
    );

    let items = response.items || [];
    if (max_results && items.length > max_results) {
      items = items.slice(0, max_results);
    }

    return {
      items,
      bookmark: response.bookmark,
      total_results: items.length,
      query_used: query,
      has_more: !!response.bookmark,
    };
  },
});
