import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateOrderDetails = createAction({
  auth: shopifyAuth,
  name: 'update_order_details',
  classification: 'WRITE',
  displayName: 'Update Order Details',
  description: 'Change the email, phone, note, tags or PO number of an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the contact email, phone, internal note, PO number or tags of one order; fields left empty are not sent and keep their values. Sending tags replaces the whole tag list, so use add_tags or remove_tags to change single tags. Line items and payments cannot be changed here. Re-running with the same values is safe.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'New contact email, for example "jane@example.com".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'New contact phone in E.164 format, for example "+16135551111".',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'New internal note. Replaces the existing note.',
      required: false,
    }),
    po_number: Property.ShortText({
      displayName: 'PO Number',
      description: 'Purchase order number, for example "PO-2026-114".',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'The complete new tag list, for example ["wholesale", "priority"]. Replaces every existing tag; leave empty to keep the current tags.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const tags = shopifyValues.readStringList(propsValue.tags);
    const patch = shopifyValues.compact({
      email: shopifyValues.nonEmpty(propsValue.email),
      phone: shopifyValues.nonEmpty(propsValue.phone),
      note: shopifyValues.nonEmpty(propsValue.note),
      poNumber: shopifyValues.nonEmpty(propsValue.po_number),
      tags: tags && tags.length > 0 ? tags : undefined,
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to update (email, phone, note, po_number or tags).');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      orderUpdate: { order: GqlOrder | null } | null;
    }>({
      auth,
      query: `mutation UpdateOrderDetails($input: OrderInput!) { orderUpdate(input: $input) { order { ${shopifyFields.ORDER_DETAIL_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['orderUpdate.order'],
      variables: { input: { id, ...patch } },
    });
    const order = data.orderUpdate?.order;
    if (!order) {
      throw new Error(`Order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapOrderDetail(order),
      redacted_fields: redactedFields,
    };
  },
});
