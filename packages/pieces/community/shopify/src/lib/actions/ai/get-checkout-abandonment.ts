import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlAbandonment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { checkoutAbandonmentOutputSchema } from '../../output-schemas/orders';

export const shopifyAiGetCheckoutAbandonment = createAction({
  auth: shopifyAuth,
  name: 'get_checkout_abandonment',
  classification: 'READ',
  displayName: 'Get Checkout Abandonment',
  description: 'Get the abandonment record of an abandoned checkout.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up the abandonment record for an abandoned checkout id (from list_abandoned_checkouts): recovery email state, whether the customer ordered since and the recovery URL. Returns found=false when Shopify does not track an abandonment for that checkout. Customer fields may be null on stores without protected customer data access. Read-only.',
    idempotent: true,
  },
  outputSchema: checkoutAbandonmentOutputSchema,
  props: {
    abandoned_checkout_id: Property.ShortText({
      displayName: 'Abandoned Checkout ID',
      description:
        'The abandoned checkout id, numeric or "gid://shopify/AbandonedCheckout/…". Find it with list_abandoned_checkouts.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const abandonedCheckoutId = shopifyGraphqlClient.toGid({
      type: 'AbandonedCheckout',
      id: propsValue.abandoned_checkout_id,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      abandonmentByAbandonedCheckoutId: GqlAbandonment | null;
    }>({
      auth,
      query: `query GetCheckoutAbandonment($abandonedCheckoutId: ID!) { abandonmentByAbandonedCheckoutId(abandonedCheckoutId: $abandonedCheckoutId) { ${shopifyFields.ABANDONMENT_FIELDS} } }`,
      variables: { abandonedCheckoutId },
    });
    const abandonment = data.abandonmentByAbandonedCheckoutId;
    if (!abandonment) {
      return {
        found: false,
        ...shopifyMappers.mapAbandonment(null),
        abandoned_checkout_id: abandonedCheckoutId,
        redacted_fields: redactedFields,
      };
    }
    return {
      found: true,
      ...shopifyMappers.mapAbandonment(abandonment),
      redacted_fields: redactedFields,
    };
  },
});
