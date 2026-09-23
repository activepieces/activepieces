import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { ShopifyAuth } from '../../common/types';

export const shopifyAiDeleteDiscount = createAction({
  auth: shopifyAuth,
  name: 'delete_discount',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Discount',
  description: 'Permanently delete a code discount or an automatic discount.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one discount, code or automatic, with all its redeem codes. Takes the full discount id: gid://shopify/DiscountCodeNode/… deletes a code discount, gid://shopify/DiscountAutomaticNode/… deletes an automatic discount (a gid://shopify/DiscountNode/… id is looked up first to find which kind it is). A plain number is rejected because code and automatic discounts are different objects; get the id from list_discounts, get_discount or find_discount_by_code. Orders that already used the discount keep it. Cannot be undone; a repeat call fails because the discount is gone. Needs the write_discounts access scope.',
    idempotent: false,
  },
  props: {
    discount_id: Property.ShortText({
      displayName: 'Discount ID',
      description:
        'The full discount id, for example "gid://shopify/DiscountCodeNode/123" or "gid://shopify/DiscountAutomaticNode/456".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const parsed = shopifyValues.readDiscountId({
      value: propsValue.discount_id,
      allow: ['code', 'automatic', 'node'],
    });
    const target = parsed.kind === 'node' ? await resolveNodeKind({ auth, id: parsed.id, numericId: parsed.numericId }) : parsed;
    if (target.kind === 'code') {
      const { data, redactedFields } = await shopifyGraphqlClient.request<{
        discountCodeDelete: { deletedCodeDiscountId?: string | null } | null;
      }>({
        auth,
        query: `mutation DeleteCodeDiscount($id: ID!) { discountCodeDelete(id: $id) { deletedCodeDiscountId userErrors { field message code } } }`,
        variables: { id: target.id },
      });
      return {
        deleted_discount_id: data.discountCodeDelete?.deletedCodeDiscountId ?? target.id,
        method: 'code',
        redacted_fields: redactedFields,
      };
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      discountAutomaticDelete: { deletedAutomaticDiscountId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteAutomaticDiscount($id: ID!) { discountAutomaticDelete(id: $id) { deletedAutomaticDiscountId userErrors { field message code } } }`,
      variables: { id: target.id },
    });
    return {
      deleted_discount_id: data.discountAutomaticDelete?.deletedAutomaticDiscountId ?? target.id,
      method: 'automatic',
      redacted_fields: redactedFields,
    };
  },
});

async function resolveNodeKind({
  auth,
  id,
  numericId,
}: {
  auth: ShopifyAuth;
  id: string;
  numericId: string;
}): Promise<{ id: string; kind: 'code' | 'automatic' }> {
  const { data } = await shopifyGraphqlClient.request<{
    discountNode: { id: string; discount?: { __typename?: string } | null } | null;
  }>({
    auth,
    query: `query ResolveDiscountKind($id: ID!) { discountNode(id: $id) { id discount { __typename } } }`,
    variables: { id },
  });
  const typename = data.discountNode?.discount?.__typename ?? '';
  if (typename.startsWith('DiscountCode')) {
    return { id: `gid://shopify/DiscountCodeNode/${numericId}`, kind: 'code' };
  }
  if (typename.startsWith('DiscountAutomatic')) {
    return { id: `gid://shopify/DiscountAutomaticNode/${numericId}`, kind: 'automatic' };
  }
  throw new Error(`Discount ${id} was not found. Nothing was deleted.`);
}
