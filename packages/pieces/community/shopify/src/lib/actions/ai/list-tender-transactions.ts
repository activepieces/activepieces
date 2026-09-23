import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMoneyV2,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 200;

export const shopifyAiListTenderTransactions = createAction({
  auth: shopifyAuth,
  name: 'list_tender_transactions',
  classification: 'SEARCH',
  displayName: 'List Tender Transactions',
  description: 'List money actually received or paid out across all orders.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists tender transactions: the money actually received or refunded across the whole store, with amount, payment method, processed date and order. Use it for payout reconciliation or daily takings; use list_order_transactions for one order. Supports search syntax such as "processed_at:>=2026-09-01". Paged: pass end_cursor back as the cursor while has_next_page is true.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify search syntax, for example "processed_at:>=2026-09-01" or "test:false". Leave empty for all.'
    ),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      tenderTransactions: GqlConnection<GqlTenderTransaction>;
    }>({
      auth,
      query: `query ListTenderTransactions($first: Int!, $after: String, $query: String, $reverse: Boolean) { tenderTransactions(first: $first, after: $after, query: $query, reverse: $reverse) { nodes { id amount { amount currencyCode } paymentMethod processedAt remoteReference test order { id name } transactionDetails { ... on TenderTransactionCreditCardDetails { creditCardCompany } } } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.tenderTransactions,
      map: (transaction: GqlTenderTransaction) => ({
        id: transaction.id,
        amount: transaction.amount?.amount ?? null,
        currency_code: transaction.amount?.currencyCode ?? null,
        payment_method: transaction.paymentMethod ?? null,
        credit_card_company: transaction.transactionDetails?.creditCardCompany ?? null,
        processed_at: transaction.processedAt ?? null,
        remote_reference: transaction.remoteReference ?? null,
        test: transaction.test ?? null,
        order_id: transaction.order?.id ?? null,
        order_name: transaction.order?.name ?? null,
      }),
      redactedFields,
    });
  },
});

type GqlTenderTransaction = {
  id: string;
  amount?: GqlMoneyV2 | null;
  paymentMethod?: string | null;
  processedAt?: string | null;
  remoteReference?: string | null;
  test?: boolean | null;
  order?: { id?: string | null; name?: string | null } | null;
  transactionDetails?: { creditCardCompany?: string | null } | null;
};
