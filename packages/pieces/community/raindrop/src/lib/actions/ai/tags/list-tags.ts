import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropListTagsOutputSchema } from '../../../output-schemas';

export const raindropListTagsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_list_tags',
  outputSchema: raindropListTagsOutputSchema,
  displayName: 'List Tags',
  description: 'Lists tags with the number of bookmarks using each.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every tag name (_id) with its bookmark count, across all collections or within one. Use it to find exact tag names before Rename Tag, Merge Tags or Delete Tags; use Get Filters for tag counts alongside type, favourite and broken-link counts.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections to list tags of. Leave empty for tags in all collections.',
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropListTagsResponse>({
      auth,
      method: HttpMethod.GET,
      path:
        propsValue.collectionId !== undefined
          ? `/tags/${encodeURIComponent(propsValue.collectionId)}`
          : '/tags',
    });
  },
});

type RaindropListTagsResponse = {
  result: boolean;
  items: { _id: string; count: number }[];
};
