import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropCreateCollectionOutputSchema } from '../../../output-schemas';

export const raindropCreateCollectionAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_create_collection',
  outputSchema: raindropCreateCollectionOutputSchema,
  displayName: 'Create Collection',
  description: 'Creates a new collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new collection, at the root or nested under a parent collection, with an optional cover. Raindrop ignores visibility and view on create; set them afterwards with Update Collection. Not idempotent: each call adds another collection, even with the same title (use List Collections first to avoid duplicates).',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Name of the collection.',
      required: true,
    }),
    parentId: raindropAiProps.collectionId({
      required: false,
      displayName: 'Parent Collection ID',
      description:
        'ID of the parent collection, from List Collections or List Child Collections. Omit to create a root collection.',
    }),
    cover: Property.Array({
      displayName: 'Cover URLs',
      description: 'Cover image URLs, e.g. one from Search Covers or List Featured Covers.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const cover = raindropUtils.toStringList({ value: propsValue.cover });
    return await raindropClient.request<RaindropCreateCollectionResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/collection',
      body: {
        title: propsValue.title,
        parent: propsValue.parentId !== undefined ? { $id: propsValue.parentId } : undefined,
        cover: cover.length > 0 ? cover : undefined,
      },
    });
  },
});

type RaindropCreateCollectionResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
