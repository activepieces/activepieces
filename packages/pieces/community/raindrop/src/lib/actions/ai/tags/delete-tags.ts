import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropDeleteTagsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_delete_tags',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Delete Tags',
  description: 'Removes tags from every bookmark that has them.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes the given tags from all bookmarks that carry them, everywhere or only within one collection; the bookmarks themselves stay. Tag names come from List Tags. Cannot be undone, but repeating the call changes nothing more.',
    idempotent: true,
  },
  props: {
    tags: raindropAiProps.tags({
      required: true,
      description: 'Tag names to remove, exactly as returned by List Tags, e.g. ["old", "temp"].',
    }),
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections to limit the removal to. Leave empty to remove from all collections.',
    }),
  },
  async run({ auth, propsValue }) {
    const tags = raindropUtils.toStringList({ value: propsValue.tags });
    if (tags.length === 0) {
      throw new Error('Tags must list at least one tag name.');
    }
    return await raindropClient.request<RaindropDeleteTagsResponse>({
      auth,
      method: HttpMethod.DELETE,
      path:
        propsValue.collectionId !== undefined
          ? `/tags/${encodeURIComponent(propsValue.collectionId)}`
          : '/tags',
      body: { tags },
    });
  },
});

type RaindropDeleteTagsResponse = {
  result: boolean;
};
