import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlChannel,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

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
      'Lists sales channels (for example Online Store, Point of Sale, Shop) with their name, handle, owning app and product count. Caveat: Shopify returns only the channels created by the calling app when that app supports multiple channels; a merchant custom app normally sees every channel, but the list may be shorter than the admin shows. To publish products use list_publications, not channel ids. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  props: {
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      channels: GqlConnection<GqlChannel>;
    }>({
      auth,
      query: `query ListSalesChannels($first: Int!, $after: String, $reverse: Boolean) { channels(first: $first, after: $after, reverse: $reverse) { nodes { ${shopifyFields.CHANNEL_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.channels,
      map: shopifyMappers.mapChannel,
      redactedFields,
    });
  },
});
