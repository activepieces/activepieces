import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlChannelPublication,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listSalesChannelsOutputSchema } from '../../output-schemas/products';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListSalesChannels = createAction({
  auth: shopifyAuth,
  name: 'list_sales_channels',
  classification: 'SEARCH',
  displayName: 'List Sales Channels',
  description: 'List the sales channels installed on the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the sales channels of the store (for example Online Store, Point of Sale, Shop), built from the store\'s app publications: each item has the channel name and handle (from the channel app) and its publication_id. Put publication_id in publication_ids of publish_resource or unpublish_resource to show or hide products and collections on that channel. Markets and B2B catalogs are not channels and are listed by list_publications. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  outputSchema: listSalesChannelsOutputSchema,
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      publications: GqlConnection<GqlChannelPublication>;
    }>({
      auth,
      query: `query ListSalesChannels($first: Int!, $after: String, $reverse: Boolean) { publications(first: $first, after: $after, catalogType: APP, reverse: $reverse) { nodes { ${shopifyFields.CHANNEL_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.publications,
      map: shopifyMappers.mapChannel,
      redactedFields,
    });
  },
});
