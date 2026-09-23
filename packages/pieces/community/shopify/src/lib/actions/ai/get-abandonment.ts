import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlAbandonment,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetAbandonment = createAction({
  auth: shopifyAuth,
  name: 'get_abandonment',
  classification: 'READ',
  displayName: 'Get Abandonment',
  description: 'Get a customer abandonment (browse, cart or checkout) by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one abandonment record by its Abandonment id: whether it was a browse, cart or checkout abandonment, the recovery email state, whether the customer ordered since, and the linked abandoned checkout. Use get_checkout_abandonment when you only have an abandoned checkout id. Customer fields may be null on stores without protected customer data access (see redacted_fields). Read-only.',
    idempotent: true,
  },
  props: {
    abandonment_id: Property.ShortText({
      displayName: 'Abandonment ID',
      description: 'The abandonment id, numeric or "gid://shopify/Abandonment/…".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Abandonment', id: propsValue.abandonment_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      abandonment: GqlAbandonment | null;
    }>({
      auth,
      query: `query GetAbandonment($id: ID!) { abandonment(id: $id) { ${shopifyFields.ABANDONMENT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.abandonment) {
      throw new Error(`Abandonment ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapAbandonment(data.abandonment),
      redacted_fields: redactedFields,
    };
  },
});
