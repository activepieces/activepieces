import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlPaymentTermsTemplate,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiListPaymentTermsTemplates = createAction({
  auth: shopifyAuth,
  name: 'list_payment_terms_templates',
  classification: 'SEARCH',
  displayName: 'List Payment Terms Templates',
  description: 'List the payment terms Shopify offers (due on receipt, net 30, fixed date…).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the payment terms templates Shopify offers for orders and draft orders that are paid later: due on receipt, due on fulfillment, net terms (for example Net 30 with due_in_days 30) and a fixed date. Each has an id, name, translated name, description, due_in_days and type. Optionally only one type. Returns the full list in one call (no paging). Needs the read_payment_terms access scope (not stated on the query page; to be confirmed). Read-only.',
    idempotent: true,
  },
  props: {
    payment_terms_type: Property.StaticDropdown({
      displayName: 'Terms Type',
      description: 'Only templates of this type. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Due on receipt', value: 'RECEIPT' },
          { label: 'Net (within a number of days)', value: 'NET' },
          { label: 'Fixed date', value: 'FIXED' },
          { label: 'Due on fulfillment', value: 'FULFILLMENT' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      paymentTermsTemplates: GqlPaymentTermsTemplate[] | null;
    }>({
      auth,
      query: `query ListPaymentTermsTemplates($paymentTermsType: PaymentTermsType) { paymentTermsTemplates(paymentTermsType: $paymentTermsType) { ${shopifyFields.PAYMENT_TERMS_TEMPLATE_FIELDS} } }`,
      variables: { paymentTermsType: propsValue.payment_terms_type },
    });
    const items = (data.paymentTermsTemplates ?? []).map(shopifyMappers.mapPaymentTermsTemplate);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
