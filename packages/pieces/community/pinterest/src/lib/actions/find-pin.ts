import { createAction, Property } from '@activepieces/pieces-framework';
import { pinterestAuth } from '../common/auth';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { pinterestOperations } from '../common/operations';
import { adAccountIdDropdown } from '../common/props';
import { findPinActionOutputSchema } from '../output-schemas';

export const findPin = createAction({
  auth: pinterestAuth,
  name: 'findPin',
  classification: 'SEARCH',
  outputSchema: findPinActionOutputSchema,
  displayName: 'Find Pin by Title/Keyword',
  description: 'Search for Pins using title, description, or keywords.',
  audience: 'human',
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
        'Search terms for pin titles, descriptions, or tags. You can also search using comma-separated pin IDs.',
    }),
    bookmark: Property.ShortText({
      displayName: 'Pagination Bookmark',
      required: false,
      description:
        'Bookmark token from previous search results for pagination.',
    }),
    max_results: Property.Number({
      displayName: 'Maximum Results',
      required: false,
      description:
        'Maximum number of pins to return (useful for large result sets).',
      defaultValue: 25,
    }),
  },
  async run({ auth, propsValue }) {
    return await pinterestOperations.searchPins({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
