import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listPinsActionOutputSchema } from '../output-schemas';

export const listPins = createAction({
  auth: pinterestAuth,
  name: 'listPins',
  classification: 'READ',
  outputSchema: listPinsActionOutputSchema,
  displayName: 'List Pins',
  description: 'List the Pins owned by the connected Pinterest account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the Pins the connected account owns across every board, newest first, returning each pin id with its title, link, board and media. Use it to survey recent content or find a pin id; use List Pins on Board when the board is already known, and Search Pins to match on text. Pages through an opaque bookmark cursor; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    pin_filter: Property.StaticDropdown({
      displayName: 'Pin Filter',
      required: false,
      description: 'Restrict the results to a subset of the account Pins.',
      options: {
        options: [
          { label: 'Exclude Native Pins', value: 'exclude_native' },
          { label: 'Exclude Repins', value: 'exclude_repins' },
          { label: 'Has Been Promoted', value: 'has_been_promoted' },
        ],
      },
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Pins per page (1-250, Pinterest defaults to 25).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { pin_filter, page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/pins', { pin_filter, page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
