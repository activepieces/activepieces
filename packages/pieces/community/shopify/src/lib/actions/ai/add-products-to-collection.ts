import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  GqlJob,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { addProductsToCollectionOutputSchema } from '../../output-schemas/products';

export const shopifyAiAddProductsToCollection = createAction({
  auth: shopifyAuth,
  name: 'add_products_to_collection',
  classification: 'WRITE',
  displayName: 'Add Products to Collection',
  description: 'Add products to a collection by hand.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds products to one collection as manual picks. Reads the collection\'s sources first, then adds the products to its first non-shared conditions source (or to source_id when given); a collection without one gets a new manual-selection source. Shared conditions sources (shareable=true in get_collection, reused by other collections) are never changed: they are skipped when choosing the default, and a shared source_id is refused. Works on manual and rule-based collections alike. Large changes may finish in the background (job_id, poll get_job). Adding a product that is already picked leaves it in the collection. Not available on Starter or Retail plans.',
    idempotent: true,
  },
  outputSchema: addProductsToCollectionOutputSchema,
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The collection id, numeric or "gid://shopify/Collection/…". Find it with search_collections.',
      required: true,
    }),
    product_ids: Property.Array({
      displayName: 'Product IDs',
      description: 'Products to add, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    source_id: Property.ShortText({
      displayName: 'Source ID',
      description: 'Optional conditions source to add the picks to (from get_collection sources). Must not be a shared source. Defaults to the first non-shared conditions source.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Collection', id: propsValue.collection_id });
    const productIds = shopifyValues.toGidList({ type: 'Product', value: propsValue.product_ids });
    if (!productIds) {
      throw new Error('Provide at least one product id to add.');
    }
    const lookup = await shopifyGraphqlClient.request<{ collection: GqlCollection | null }>({
      auth,
      query: `query AddProductsToCollectionSources($id: ID!) { collection(id: $id) { ${shopifyFields.COLLECTION_SOURCE_LOOKUP_FIELDS} } }`,
      variables: { id },
    });
    if (!lookup.data.collection) {
      throw new Error(`Collection ${id} was not found.`);
    }
    const source = shopifyValues.findConditionsSource({
      collection: lookup.data.collection,
      sourceId: shopifyValues.nonEmpty(propsValue.source_id),
    });
    const selections = productIds.map((productId) => ({ productId }));
    const change = source
      ? { sourcesToUpdate: [{ condition: { id: source.id, inclusion: { selectionsToAdd: selections } } }] }
      : {
          sourcesToCreate: [
            {
              source: {
                title: shopifyFields.MANUAL_SELECTION_SOURCE_TITLE,
                inclusion: { selections },
              },
            },
          ],
        };
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionUpdate: { collection: GqlCollection | null; job: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation AddProductsToCollection($collection: CollectionUpdateInput!) { collectionUpdate(collection: $collection) { collection { ${shopifyFields.COLLECTION_FIELDS} } job { id done } userErrors { field message } } }`,
      variables: { collection: { id, ...change } },
    });
    const collection = data.collectionUpdate?.collection;
    if (!collection) {
      throw new Error(`Collection ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapCollection(collection),
      added_product_ids: productIds,
      source_id_used: source?.id ?? null,
      created_source: source === undefined,
      job_id: data.collectionUpdate?.job?.id ?? null,
      job_done: data.collectionUpdate?.job?.done ?? null,
      redacted_fields: [...lookup.redactedFields, ...redactedFields],
    };
  },
});
