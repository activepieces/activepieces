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
  displayName: 'Find Pin by Keyword',
  description: 'Search for Pins using title, description, or keywords.',
  audience: 'human',
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
    return await pinterestOperations.searchPins({
      accessToken: getAccessTokenOrThrow(auth),
      ...propsValue,
    });
  },
});
