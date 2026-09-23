import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlDispute,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 200;

export const shopifyAiListPaymentDisputes = createAction({
  auth: shopifyAuth,
  name: 'list_payment_disputes',
  classification: 'SEARCH',
  displayName: 'List Payment Disputes',
  description: 'List Shopify Payments disputes (chargebacks and inquiries).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Shopify Payments disputes: chargebacks and inquiries that buyers filed with their card issuer, each with status (for example NEEDS_RESPONSE, UNDER_REVIEW, WON, LOST), type, reason, amount and currency, the evidence due date, when evidence was sent, and the order. Plan requirement: only stores that use Shopify Payments have disputes; on other stores, and on development stores using a test gateway, the list is empty. Filter with Shopify search syntax such as "status:needs_response" or "initiated_at:>2026-09-01". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_shopify_payments_disputes access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify dispute search syntax, for example "status:needs_response" or "initiated_at:>2026-09-01". Leave empty to list all.'
    ),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      disputes: GqlConnection<GqlDispute>;
    }>({
      auth,
      query: `query ListPaymentDisputes($first: Int!, $after: String, $query: String, $reverse: Boolean) { disputes(first: $first, after: $after, query: $query, reverse: $reverse) { nodes { ${shopifyFields.DISPUTE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.disputes,
      map: shopifyMappers.mapDispute,
      redactedFields,
    });
  },
});
