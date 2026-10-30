import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropListHighlightsOutputSchema } from '../../../output-schemas';

export const raindropListHighlightsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_highlights',
  outputSchema: raindropListHighlightsOutputSchema,
  displayName: 'List Highlights',
  description: 'Lists highlights across all bookmarks or in one collection.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists highlights with their text, color, tags and the bookmark they belong to (raindropRef), newest first, one page at a time. Set Collection ID (from List Collections) to limit to one collection; leave it empty for all. Returns the highlight IDs Update Highlight and Delete Highlight need.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections to list highlights of. Leave empty for highlights in all collections.',
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Zero-based page number. Defaults to 0.',
      required: false,
    }),
    perpage: Property.Number({
      displayName: 'Per Page',
      description: 'Highlights per page, 1 to 50. Defaults to 25.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const perpage = Math.min(Math.max(propsValue.perpage ?? 25, 1), 50);
    return await raindropClient.request<RaindropListHighlightsResponse>({
      auth,
      method: HttpMethod.GET,
      path:
        propsValue.collectionId !== undefined
          ? `/highlights/${propsValue.collectionId}`
          : '/highlights',
      query: {
        page: String(propsValue.page ?? 0),
        perpage: String(perpage),
      },
    });
  },
});

type RaindropListHighlightsResponse = {
  result: boolean;
  items: Record<string, unknown>[];
};
