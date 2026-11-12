import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropMergeTagsAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_merge_tags',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Merge Tags',
  description: 'Merges several tags into one tag.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces each of the given tags with one target tag on every bookmark that has them, everywhere or only within one collection. Tag names come from List Tags. To rename a single tag, use Rename Tag.',
    idempotent: true,
  },
  props: {
    tags: raindropAiProps.tags({
      required: true,
      description:
        'Tag names to merge, exactly as returned by List Tags, e.g. ["js", "javascript"].',
    }),
    newName: Property.ShortText({
      displayName: 'Merged Tag Name',
      description:
        'Name of the tag they are merged into. Can be one of the listed tags or a new name.',
      required: true,
    }),
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections to limit the merge to. Leave empty to merge in all collections.',
    }),
  },
  async run({ auth, propsValue }) {
    const tags = raindropUtils.toStringList({ value: propsValue.tags });
    if (tags.length === 0) {
      throw new Error('Tags must list at least one tag name.');
    }
    return await raindropClient.request<RaindropMergeTagsResponse>({
      auth,
      method: HttpMethod.PUT,
      path:
        propsValue.collectionId !== undefined
          ? `/tags/${encodeURIComponent(propsValue.collectionId)}`
          : '/tags',
      body: {
        replace: propsValue.newName,
        tags,
      },
    });
  },
});

type RaindropMergeTagsResponse = {
  result: boolean;
};
