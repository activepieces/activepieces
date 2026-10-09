import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  GqlCollectionSource,
  GqlJob,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { removeProductsFromCollectionOutputSchema } from '../../output-schemas/products';

export const shopifyAiRemoveProductsFromCollection = createAction({
  auth: shopifyAuth,
  name: 'remove_products_from_collection',
  classification: 'WRITE',
  displayName: 'Remove Products from Collection',
  description: 'Remove hand-picked products from a collection.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes manual picks from one collection. Reads the collection\'s sources first, then removes the products from every non-shared conditions source in one update (or only from source_id when given). Shared conditions sources (shareable=true in get_collection, reused by other collections) are never changed: a shared source_id is refused, and a collection whose only conditions sources are shared is refused with their ids. Only manual selections are removed: a product that still matches one of the collection\'s conditions stays in the collection; change the conditions with update_collection for that. The products themselves are not deleted. Large changes may finish in the background (job_id, poll get_job). Removing a product that is not picked leaves it unpicked.',
    idempotent: true,
  },
  outputSchema: removeProductsFromCollectionOutputSchema,
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The collection id, numeric or "gid://shopify/Collection/…". Find it with search_collections.',
      required: true,
    }),
    product_ids: Property.Array({
      displayName: 'Product IDs',
      description: 'Products to remove, numeric or "gid://shopify/Product/…".',
      required: true,
    }),
    source_id: Property.ShortText({
      displayName: 'Source ID',
      description: 'Optional conditions source to remove the picks from (from get_collection sources). Must not be a shared source. Leave empty to remove from every non-shared conditions source.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Collection', id: propsValue.collection_id });
    const productIds = shopifyValues.toGidList({ type: 'Product', value: propsValue.product_ids });
    if (!productIds) {
      throw new Error('Provide at least one product id to remove.');
    }
    const lookup = await shopifyGraphqlClient.request<{ collection: GqlCollection | null }>({
      auth,
      query: `query RemoveProductsFromCollectionSources($id: ID!) { collection(id: $id) { ${shopifyFields.COLLECTION_SOURCE_LOOKUP_FIELDS} } }`,
      variables: { id },
    });
    const lookedUp = lookup.data.collection;
    if (!lookedUp) {
      throw new Error(`Collection ${id} was not found.`);
    }
    const sourceId = shopifyValues.nonEmpty(propsValue.source_id);
    const sources = sourceId
      ? [shopifyValues.findExplicitConditionsSource({ collection: lookedUp, sourceId })]
      : shopifyValues.editableConditionsSources(lookedUp);
    if (sources.length === 0) {
      throw new Error(noEditableSourceMessage({ id, shared: shopifyValues.sharedConditionsSources(lookedUp) }));
    }
    const selectionsToRemove = productIds.map((productId) => ({ productId }));
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionUpdate: { collection: GqlCollection | null; job: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation RemoveProductsFromCollection($collection: CollectionUpdateInput!) { collectionUpdate(collection: $collection) { collection { ${shopifyFields.COLLECTION_FIELDS} } job { id done } userErrors { field message } } }`,
      variables: {
        collection: {
          id,
          sourcesToUpdate: sources.map((source) => ({
            condition: { id: source.id, inclusion: { selectionsToRemove } },
          })),
        },
      },
    });
    const collection = data.collectionUpdate?.collection;
    if (!collection) {
      throw new Error(`Collection ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapCollection(collection),
      removed_product_ids: productIds,
      source_ids_used: sources.map((source) => source.id),
      job_id: data.collectionUpdate?.job?.id ?? null,
      job_done: data.collectionUpdate?.job?.done ?? null,
      redacted_fields: [...lookup.redactedFields, ...redactedFields],
    };
  },
});

function noEditableSourceMessage({ id, shared }: { id: string; shared: GqlCollectionSource[] }): string {
  if (shared.length === 0) {
    return `Collection ${id} has no hand-picked products to remove (it has no conditions source).`;
  }
  const names = shared.map((source) => `${source.id} ("${source.title ?? ''}")`).join(', ');
  return `Collection ${id} has only shared conditions sources (${names}); they are reused by other collections, so removing picks there would change those collections too. Nothing was removed.`;
}
