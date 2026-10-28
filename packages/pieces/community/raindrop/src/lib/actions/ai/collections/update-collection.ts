import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { raindropAuth } from '../../../auth';
import { raindropAiProps } from '../../../common/ai-props';
import { raindropClient } from '../../../common/client';
import { raindropUtils } from '../../../common/utils';
import { raindropUpdateCollectionOutputSchema } from '../../../output-schemas';

export const raindropUpdateCollectionAction = createAction({
  auth: raindropAuth,
  name: 'raindrop_update_collection',
  outputSchema: raindropUpdateCollectionOutputSchema,
  displayName: 'Update Collection',
  description: 'Updates an existing collection.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on an existing collection: title, parent, visibility, view, cover or expanded state. Get the collection ID from List Collections or List Child Collections. To upload a cover image file use Upload Collection Cover instead.',
    idempotent: true,
  },
  props: {
    collectionId: raindropAiProps.collectionId({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New name of the collection.',
      required: false,
    }),
    parentId: raindropAiProps.collectionId({
      required: false,
      displayName: 'Parent Collection ID',
      description:
        'ID of the new parent collection, from List Collections or List Child Collections.',
    }),
    public: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Public',
      description: 'Make the collection and its bookmarks accessible without authentication.',
    }),
    view: raindropAiProps.collectionView({ required: false }),
    cover: Property.Array({
      displayName: 'Cover URLs',
      description:
        'Cover image URLs, e.g. one from Search Covers or List Featured Covers. Replaces the current cover.',
      required: false,
    }),
    clearCover: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Clear Cover',
      description: 'Yes removes the current cover. Cannot be combined with Cover URLs.',
    }),
    moveToRoot: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Move to Root',
      description:
        'Yes makes the collection a root collection. Cannot be combined with Parent Collection ID.',
    }),
    expanded: raindropAiProps.booleanChoice({
      required: false,
      displayName: 'Expanded',
      description: "Show the collection's sub-collections expanded.",
    }),
  },
  async run({ auth, propsValue }) {
    const cover = raindropUtils.toStringList({ value: propsValue.cover });
    const clearCover = raindropUtils.toBoolean({ value: propsValue.clearCover }) === true;
    const moveToRoot = raindropUtils.toBoolean({ value: propsValue.moveToRoot }) === true;
    if (clearCover && cover.length > 0) {
      throw new Error('Set either Cover URLs or Clear Cover, not both.');
    }
    if (moveToRoot && propsValue.parentId !== undefined) {
      throw new Error('Set either Parent Collection ID or Move to Root, not both.');
    }
    const parent = propsValue.parentId !== undefined ? { $id: propsValue.parentId } : undefined;
    return await raindropClient.request<RaindropUpdateCollectionResponse>({
      auth,
      method: HttpMethod.PUT,
      path: `/collection/${encodeURIComponent(propsValue.collectionId)}`,
      body: {
        title: propsValue.title,
        parent: moveToRoot ? null : parent,
        public: raindropUtils.toBoolean({ value: propsValue.public }),
        view: propsValue.view,
        cover: clearCover ? [] : cover.length > 0 ? cover : undefined,
        expanded: raindropUtils.toBoolean({ value: propsValue.expanded }),
      },
    });
  },
});

type RaindropUpdateCollectionResponse = {
  result: boolean;
  item: Record<string, unknown>;
};
