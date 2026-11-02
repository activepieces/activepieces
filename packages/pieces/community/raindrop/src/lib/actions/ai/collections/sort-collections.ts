import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropSortCollectionsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_sort_collections',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Sort Collections',
  description: 'Reorders all collections by title or bookmark count.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Reorders all of the user's collections at once: alphabetically ascending or descending, or by bookmark count descending.",
    idempotent: true,
  },
  props: {
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Order to apply to all collections.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Title (A to Z)', value: 'title' },
          { label: 'Title (Z to A)', value: '-title' },
          { label: 'Bookmark count (most first)', value: '-count' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropSortCollectionsResponse>({
      auth,
      method: HttpMethod.PUT,
      path: '/collections',
      body: { sort: propsValue.sort },
    });
  },
});

type RaindropSortCollectionsResponse = {
  result: boolean;
};
