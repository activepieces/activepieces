import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDraftOrder,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateDraftOrder = createAction({
  auth: shopifyAuth,
  name: 'update_draft_order',
  classification: 'WRITE',
  displayName: 'Update Draft Order',
  description: 'Change the line items, customer, contact, tags or payment terms of a draft order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes an open draft order; fields left empty are not sent and keep their values. Sending line items replaces all existing line items, and sending tags replaces all tags (use add_tags / remove_tags for single tags). Set payment terms here before complete_draft_order to leave the resulting order payment-pending. Re-running with the same values is safe.',
    idempotent: true,
  },
  props: {
    draft_order_id: Property.ShortText({
      displayName: 'Draft Order ID',
      description: 'The draft order id, numeric or "gid://shopify/DraftOrder/…". Find it with list_draft_orders.',
      required: true,
    }),
    line_items: shopifyProps.draftLineItems({
      required: false,
      description:
        'The complete new list of line items. Replaces every existing line item; leave empty to keep the current items.',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter currency for the unit prices given in line items, for example "USD".',
      required: false,
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Customer the draft is for, numeric or "gid://shopify/Customer/…".',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email the invoice is sent to.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone in E.164 format.',
      required: false,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'New internal note. Replaces the existing note.',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The complete new tag list. Replaces every existing tag; leave empty to keep the current tags.',
      required: false,
    }),
    po_number: Property.ShortText({
      displayName: 'PO Number',
      description: 'Purchase order number.',
      required: false,
    }),
    payment_terms_template_id: Property.ShortText({
      displayName: 'Payment Terms Template ID',
      description:
        'Payment terms to apply, as a full id such as "gid://shopify/PaymentTermsTemplate/4". With payment terms, completing the draft leaves the order payment-pending.',
      required: false,
    }),
    payment_issued_at: Property.DateTime({
      displayName: 'Payment Terms Issued At',
      description: 'Start date for net payment terms (for example net 30), ISO 8601.',
      required: false,
    }),
    payment_due_at: Property.DateTime({
      displayName: 'Payment Due At',
      description: 'Due date for fixed-date payment terms, ISO 8601.',
      required: false,
    }),
    reserve_inventory_until: Property.DateTime({
      displayName: 'Reserve Inventory Until',
      description: 'Hold the stock for this draft until this time (ISO 8601).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const currency = shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase();
    const lineItems = shopifyValues.buildDraftLineItems({ value: propsValue.line_items, currency });
    const tags = shopifyValues.readStringList(propsValue.tags);
    const customerId = shopifyValues.nonEmpty(propsValue.customer_id);
    const patch = shopifyValues.compact({
      lineItems: lineItems.length > 0 ? lineItems : undefined,
      purchasingEntity: customerId
        ? { customerId: shopifyGraphqlClient.toGid({ type: 'Customer', id: customerId }) }
        : undefined,
      email: shopifyValues.nonEmpty(propsValue.email),
      phone: shopifyValues.nonEmpty(propsValue.phone),
      note: shopifyValues.nonEmpty(propsValue.note),
      tags: tags && tags.length > 0 ? tags : undefined,
      poNumber: shopifyValues.nonEmpty(propsValue.po_number),
      paymentTerms: buildPaymentTerms({
        templateId: shopifyValues.nonEmpty(propsValue.payment_terms_template_id),
        issuedAt: shopifyValues.nonEmpty(propsValue.payment_issued_at),
        dueAt: shopifyValues.nonEmpty(propsValue.payment_due_at),
      }),
      reserveInventoryUntil: shopifyValues.nonEmpty(propsValue.reserve_inventory_until),
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'DraftOrder', id: propsValue.draft_order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      draftOrderUpdate: { draftOrder: GqlDraftOrder | null } | null;
    }>({
      auth,
      query: `mutation UpdateDraftOrder($id: ID!, $input: DraftOrderInput!) { draftOrderUpdate(id: $id, input: $input) { draftOrder { ${shopifyFields.DRAFT_ORDER_DETAIL_FIELDS} } userErrors { field message } } }`,
      primaryPaths: ['draftOrderUpdate.draftOrder'],
      variables: { id, input: patch },
    });
    const draft = data.draftOrderUpdate?.draftOrder;
    if (!draft) {
      throw new Error(`Draft order ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapDraftOrderDetail(draft),
      redacted_fields: redactedFields,
    };
  },
});

function buildPaymentTerms({
  templateId,
  issuedAt,
  dueAt,
}: {
  templateId: string | undefined;
  issuedAt: string | undefined;
  dueAt: string | undefined;
}): Record<string, unknown> | undefined {
  if (!templateId) {
    if (issuedAt || dueAt) {
      throw new Error('Set "payment_terms_template_id" when giving payment dates.');
    }
    return undefined;
  }
  const schedule = shopifyValues.compact({ issuedAt, dueAt });
  return shopifyValues.compact({
    paymentTermsTemplateId: shopifyGraphqlClient.toGid({ type: 'PaymentTermsTemplate', id: templateId }),
    paymentSchedules: Object.keys(schedule).length > 0 ? [schedule] : undefined,
  });
}
