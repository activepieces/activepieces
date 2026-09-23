import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMedia,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 50;

export const shopifyAiListProductMedia = createAction({
  auth: shopifyAuth,
  name: 'list_product_media',
  classification: 'SEARCH',
  displayName: 'List Product Media',
  description: 'List the images, videos and 3D models of a product, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the media of one product in display order: id, type, processing status, alt text and URL. The ids are needed by update_product_media, delete_product_media, reorder_product_media and attach_variant_media. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product id, numeric or "gid://shopify/Product/…". Find it with search_products.',
      required: true,
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Product', id: propsValue.product_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      product: { id: string; media: GqlConnection<GqlMedia> } | null;
    }>({
      auth,
      query: `query ListProductMedia($id: ID!, $first: Int!, $after: String, $reverse: Boolean) { product(id: $id) { id media(first: $first, after: $after, reverse: $reverse, sortKey: POSITION) { nodes { ${shopifyFields.MEDIA_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        id,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
      primaryPaths: ['product.media'],
    });
    if (!data.product) {
      throw new Error(`Product ${id} was not found.`);
    }
    return shopifyMappers.toPage({
      connection: data.product.media,
      map: shopifyMappers.mapMedia,
      redactedFields,
    });
  },
});
