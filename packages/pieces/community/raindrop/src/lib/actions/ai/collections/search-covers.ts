import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropSearchCoversOutputSchema } from '../../../output-schemas';

export const raindropSearchCoversAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_search_covers',
  outputSchema: raindropSearchCoversOutputSchema,
  displayName: 'Search Covers',
  description: 'Searches cover icons by keyword.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches the cover icon library by keyword and returns icon image URLs grouped by source. Pass a returned URL as a cover to Create Collection or Update Collection. Use List Featured Covers to browse without a keyword.',
    idempotent: true,
  },
  props: {
    text: Property.ShortText({
      displayName: 'Search Text',
      description: 'Keyword to search for, e.g. "pokemon".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropSearchCoversResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/collections/covers/${encodeURIComponent(propsValue.text)}`,
    });
  },
});

type RaindropSearchCoversResponse = {
  result: boolean;
  items: { title: string; icons: { png?: string; svg?: string }[] }[];
};
