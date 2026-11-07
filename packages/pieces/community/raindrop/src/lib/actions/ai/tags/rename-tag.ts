import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropEmptyTrashOutputSchema } from '../../../output-schemas';

export const raindropRenameTagAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_rename_tag',
  outputSchema: raindropEmptyTrashOutputSchema,
  displayName: 'Rename Tag',
  description: 'Renames a tag on every bookmark that has it.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames one tag on all bookmarks that carry it, everywhere or only within one collection. Tag names come from List Tags. To fold several tags into one, use Merge Tags.',
    idempotent: true,
  },
  props: {
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Current tag name, exactly as returned by List Tags.',
      required: true,
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'New tag name.',
      required: true,
    }),
    collectionId: raindropAiProps.collectionId({
      required: false,
      description:
        'Collection ID from List Collections to limit the rename to. Leave empty to rename in all collections.',
    }),
  },
  async run({ auth, propsValue }) {
    return await raindropClient.request<RaindropRenameTagResponse>({
      auth,
      method: HttpMethod.PUT,
      path:
        propsValue.collectionId !== undefined
          ? `/tags/${encodeURIComponent(propsValue.collectionId)}`
          : '/tags',
      body: {
        replace: propsValue.newName,
        tags: [propsValue.tag],
      },
    });
  },
});

type RaindropRenameTagResponse = {
  result: boolean;
};
