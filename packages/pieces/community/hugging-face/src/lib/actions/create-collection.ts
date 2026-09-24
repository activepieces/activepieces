import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { createCollectionOutputSchema } from '../output-schemas';

function summarizeCollection({ body, created }: { body: unknown; created: boolean }) {
  const record = hfHub.isRecord(body) ? body : {};
  const slug = hfWrite.readString({ record, key: 'slug' });
  const items = Array.isArray(record['items']) ? record['items'] : [];
  const isPrivate = record['private'];
  return {
    created,
    slug,
    title: hfWrite.readString({ record, key: 'title' }),
    description: hfWrite.readString({ record, key: 'description' }),
    private: typeof isPrivate === 'boolean' ? isPrivate : null,
    item_count: items.length,
    url: slug ? `${hfHub.baseUrl}/collections/${slug}` : null,
  };
}

export const createCollection = createAction({
  auth: huggingFaceAuth,
  name: 'create_collection',
  classification: 'WRITE',
  displayName: 'Create Collection',
  description: 'Create a Hugging Face collection, or return it if one with the same title already exists.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates a collection (a curated list of models, datasets, Spaces and papers) under the connected user or an organization, private by default, optionally seeded with one item. If a collection with that title already exists in the namespace it is returned unchanged with created:false (the seed item is then not added), so retries are safe. Returns the slug that Add Item to Collection and Get Collection need. Only make it public when the user asks. Requires a write-role token.",
    idempotent: true,
  },
  outputSchema: createCollectionOutputSchema,
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The collection title, 1 to 60 characters.',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The user or organization that owns the collection. Leave empty for the connected user.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'Optional short description, up to 150 characters.',
      required: false,
    }),
    private: Property.Checkbox({
      displayName: 'Private',
      description: 'Keep the collection private (default). Turn off only to publish it to everyone.',
      required: false,
      defaultValue: true,
    }),
    item_type: Property.StaticDropdown({
      displayName: 'First Item Type',
      description: 'Optional type of an item to add right away. Requires First Item ID.',
      required: false,
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
      displayName: 'First Item ID',
      description:
        "Optional ID of the first item: a repository ID like 'openai-community/gpt2', an arXiv ID like '2307.09288', or a collection slug. Requires First Item Type.",
      required: false,
    }),
  },
  async run(context) {
    const { title, namespace, description, item_type, item_id } = context.propsValue;
    const token = context.auth.secret_text;
    const collectionTitle = hfWrite.requireText({ value: title, name: 'Title', maxLength: 60 });
    const collectionDescription = hfWrite.optionalText({ value: description, name: 'Description', maxLength: 150 });
    const itemId = hfWrite.optionalText({ value: item_id, name: 'First Item ID' });
    if ((item_type === undefined || item_type === null) !== (itemId === undefined)) {
      throw new Error('Set both First Item Type and First Item ID, or neither.');
    }
    const owner = hfWrite.optionalText({ value: namespace, name: 'Namespace' }) ?? (await hfWrite.currentUsername(token));
    const body: Record<string, unknown> = {
      title: collectionTitle,
      namespace: owner,
      private: context.propsValue.private !== false,
    };
    if (collectionDescription !== undefined) {
      body['description'] = collectionDescription;
    }
    if (item_type && itemId !== undefined) {
      body['item'] = { type: item_type, id: itemId };
    }
    const outcome = await hfWrite.createOrConflict({
      token,
      method: HttpMethod.POST,
      path: '/api/collections',
      body,
    });
    if (!outcome.conflict) {
      return summarizeCollection({ body: outcome.body, created: true });
    }
    const existingSlug = hfWrite.readString({ record: outcome.body, key: 'slug' });
    if (!existingSlug) {
      throw new Error(
        `COLLECTION_EXISTS: a collection titled '${collectionTitle}' already exists in '${owner}', but the Hub did not return its slug. Find it with List Collections.`
      );
    }
    const existing = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: hfWrite.collectionApiPath(hfWrite.parseCollectionSlug(existingSlug)),
    });
    return summarizeCollection({ body: existing.body, created: false });
  },
});
