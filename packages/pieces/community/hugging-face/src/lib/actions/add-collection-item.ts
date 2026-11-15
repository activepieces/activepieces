import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { addCollectionItemOutputSchema } from '../output-schemas';

export const addCollectionItem = createAction({
  auth: huggingFaceAuth,
  name: 'add_collection_item',
  classification: 'WRITE',
  displayName: 'Add Item to Collection',
  description: 'Add a model, dataset, Space, paper or collection to a Hugging Face collection.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Adds one model, dataset, Space, paper or nested collection to an existing collection, with an optional note. Get the collection slug from Create Collection, List Collections or the collection URL. If the Hub reports the item as already present the call fails with ITEM_ALREADY_IN_COLLECTION; before retrying a failed call, check the items with Get Collection. Requires a write-role token with write access to the collection owner.",
    idempotent: false,
  },
  outputSchema: addCollectionItemOutputSchema,
  props: {
    slug: Property.ShortText({
      displayName: 'Collection Slug',
      description:
        "The full collection slug in 'namespace/title-id' form, for example 'my-user/my-picks-66f448ffc8c32f949b04c8cf' (the part after huggingface.co/collections/).",
      required: true,
    }),
    item_type: Property.StaticDropdown({
      displayName: 'Item Type',
      description: 'The kind of item to add.',
      required: true,
      defaultValue: 'model',
      options: {
        disabled: false,
        options: [
          { label: 'Model', value: 'model' },
          { label: 'Dataset', value: 'dataset' },
          { label: 'Space', value: 'space' },
          { label: 'Paper', value: 'paper' },
          { label: 'Collection', value: 'collection' },
        ],
      },
    }),
    item_id: Property.ShortText({
      displayName: 'Item ID',
      description:
        "The item to add: a repository ID like 'openai-community/gpt2', an arXiv ID like '2307.09288', or a collection slug.",
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional note shown next to the item, up to 500 characters.',
      required: false,
    }),
  },
  async run(context) {
    const { slug, item_type, item_id, note } = context.propsValue;
    const collectionSlug = hfWrite.parseCollectionSlug(slug);
    const itemId = hfWrite.requireText({ value: item_id, name: 'Item ID' });
    const itemNote = hfWrite.optionalText({ value: note, name: 'Note', maxLength: 500 });
    const body: Record<string, unknown> = { item: { type: item_type, id: itemId } };
    if (itemNote !== undefined) {
      body['note'] = itemNote;
    }
    const response = await hfWrite.request({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `${hfWrite.collectionApiPath(collectionSlug)}/items`,
      body,
      statusErrors: {
        409: (detail) =>
          new Error(
            `ITEM_ALREADY_IN_COLLECTION: '${itemId}' is already in ${collectionSlug}.${detail ? ` Details: ${detail}` : ''}`
          ),
      },
    });
    const record = hfHub.isRecord(response) ? response : {};
    const items = Array.isArray(record['items']) ? record['items'] : [];
    const added = items.find(
      (item) => hfWrite.readString({ record: item, key: 'id' }) === itemId && hfWrite.readString({ record: item, key: 'type' }) === item_type
    );
    return {
      slug: collectionSlug,
      item_type,
      item_id: itemId,
      item_object_id: hfWrite.readString({ record: added, key: '_id' }),
      item_count: items.length,
      url: `${hfHub.baseUrl}/collections/${collectionSlug}`,
    };
  },
});
