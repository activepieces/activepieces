import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateCollection = createAction({
  auth: shopifyAuth,
  name: 'create_collection',
  classification: 'WRITE',
  displayName: 'Create Collection',
  description: 'Create a manual collection, optionally with an initial list of products.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one collection whose products are picked by hand (the equivalent of a custom collection), optionally with the given products already in it. Use create_smart_collection for a rule-based collection, add_products_to_collection to add more products later, and publish_resource to make it visible on a sales channel. Not available on Starter or Retail plans. Each call creates another collection, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Collection title, for example "Summer Sale".',
      required: true,
    }),
    description_html: Property.LongText({
      displayName: 'Description (HTML)',
      description: 'Collection description, HTML allowed.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'URL handle, for example "summer-sale". Generated from the title when empty.',
      required: false,
    }),
    product_ids: Property.Array({
      displayName: 'Product IDs',
      description: 'Products to put in the collection, numeric or "gid://shopify/Product/…".',
      required: false,
    }),
    sort_order: shopifyProps.collectionSortOrder(),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of the collection image.',
      required: false,
    }),
    image_alt: Property.ShortText({
      displayName: 'Image Alt Text',
      description: 'Accessible description of the collection image.',
      required: false,
    }),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Theme template suffix, for example "sale" for collection.sale.liquid.',
      required: false,
    }),
    seo_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'Page title for search engines.',
      required: false,
    }),
    seo_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'Meta description for search engines.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const productIds = shopifyValues.toGidList({ type: 'Product', value: propsValue.product_ids });
    const imageUrl = shopifyValues.nonEmpty(propsValue.image_url);
    const collection = shopifyValues.compact({
      title: propsValue.title,
      descriptionHtml: shopifyValues.nonEmpty(propsValue.description_html),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      sortOrder: propsValue.sort_order,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
      image: imageUrl
        ? shopifyValues.compact({ src: imageUrl, altText: shopifyValues.nonEmpty(propsValue.image_alt) })
        : undefined,
      seo: shopifyValues.toSeo({ title: propsValue.seo_title, description: propsValue.seo_description }),
      sources: productIds
        ? [
            {
              source: {
                title: shopifyFields.MANUAL_SELECTION_SOURCE_TITLE,
                inclusion: { selections: productIds.map((productId) => ({ productId })) },
              },
            },
          ]
        : undefined,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionCreate: { collection: GqlCollection | null } | null;
    }>({
      auth,
      query: `mutation CreateCollection($collection: CollectionCreateInput!) { collectionCreate(collection: $collection) { collection { ${shopifyFields.COLLECTION_FIELDS} } userErrors { field message } } }`,
      variables: { collection },
    });
    const created = data.collectionCreate?.collection;
    if (!created) {
      throw new Error('Shopify did not return the new collection.');
    }
    return {
      ...shopifyMappers.mapCollection(created),
      redacted_fields: redactedFields,
    };
  },
});
