import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlShopPayReceipt,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 110;

export const shopifyAiListShopPayPaymentRequestReceipts = createAction({
  auth: shopifyAuth,
  name: 'list_shop_pay_payment_request_receipts',
  classification: 'SEARCH',
  displayName: 'List Shop Pay Payment Receipts',
  description: 'List Shop Pay payment request receipts.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Shop Pay payment request receipts: one per Shop Pay payment request a buyer completed, with its token, your source identifier, creation time, processing state (READY, PROCESSING, COMPLETED, FAILED, ACTION_REQUIRED) with any error, the resulting order and the request totals in the presentment currency. Plan requirement: only stores that take payments through Shopify Payments with Shop Pay payment requests (API 2026-01 and later) have receipts; elsewhere the list is empty. Filter with Shopify search syntax such as "state:COMPLETED", "source_identifier:1282823" or "created_at:>2026-09-01". Paged: pass end_cursor back as the cursor while has_next_page is true. The required access scope is not documented. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify receipt search syntax, for example "state:COMPLETED" or "created_at:>2026-09-01". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Created at', value: 'CREATED_AT' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      shopPayPaymentRequestReceipts: GqlConnection<GqlShopPayReceipt> | null;
    }>({
      auth,
      query: `query ListShopPayPaymentRequestReceipts($first: Int!, $after: String, $query: String, $sortKey: ShopPayPaymentRequestReceiptsSortKeys, $reverse: Boolean) { shopPayPaymentRequestReceipts(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.SHOP_PAY_RECEIPT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.shopPayPaymentRequestReceipts,
      map: shopifyMappers.mapShopPayReceipt,
      redactedFields,
    });
  },
});
