import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroCreatePurchaseOrderAi = createAction({
  auth: xeroAuth,
  name: 'xero_create_purchase_order_ai',
  classification: 'WRITE',
  displayName: 'Create Purchase Order',
  description: 'Creates a purchase order to a supplier contact ID with line items.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a purchase order to an existing supplier ContactID with JSON line items and optional delivery details; saved as DRAFT unless Status is SUBMITTED or AUTHORISED. Use Update Purchase Order to change it later. Not idempotent: each call creates another purchase order.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.purchaseOrder,
  props: {
    tenant_id: aiProps.tenantId(),
    contact_id: aiProps.id({ displayName: 'Contact ID', description: 'Xero ContactID (a GUID) of the supplier.' }),
    line_items: aiProps.lineItems(),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', required: false }),
    delivery_date: Property.ShortText({ displayName: 'Delivery Date (YYYY-MM-DD)', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    purchase_order_number: Property.ShortText({ displayName: 'Purchase Order Number', required: false }),
    delivery_address: Property.LongText({ displayName: 'Delivery Address', required: false }),
    attention_to: Property.ShortText({ displayName: 'Attention To', required: false }),
    telephone: Property.ShortText({ displayName: 'Telephone', required: false }),
    delivery_instructions: Property.LongText({ displayName: 'Delivery Instructions', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'DRAFT',
      options: { options: [{ label: 'Draft', value: 'DRAFT' }, { label: 'Submitted for approval', value: 'SUBMITTED' }, { label: 'Authorised', value: 'AUTHORISED' }] },
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: { options: [{ label: 'Tax exclusive', value: 'Exclusive' }, { label: 'Tax inclusive', value: 'Inclusive' }, { label: 'No tax', value: 'NoTax' }] },
    }),
    currency_code: Property.ShortText({ displayName: 'Currency Code', description: 'ISO code such as USD; defaults to the organisation base currency.', required: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const contactId = xeroInput.requiredText({ value: values.contact_id, field: 'Contact ID' });
    const lineItems = aiInput.parseLineItems({ value: values.line_items });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const deliveryDate = xeroInput.parseDateInput({ value: values.delivery_date, field: 'Delivery Date' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.PUT,
      url: `${XERO_URLS.api}/PurchaseOrders`,
      queryParams: { unitdp: '4' },
      body: {
        PurchaseOrders: [
          {
            Contact: { ContactID: contactId },
            LineItems: lineItems,
            Status: values.status ?? 'DRAFT',
            ...(date ? { Date: date } : {}),
            ...(deliveryDate ? { DeliveryDate: deliveryDate } : {}),
            ...(text(values.reference) ? { Reference: text(values.reference) } : {}),
            ...(text(values.purchase_order_number) ? { PurchaseOrderNumber: text(values.purchase_order_number) } : {}),
            ...(text(values.delivery_address) ? { DeliveryAddress: text(values.delivery_address) } : {}),
            ...(text(values.attention_to) ? { AttentionTo: text(values.attention_to) } : {}),
            ...(text(values.telephone) ? { Telephone: text(values.telephone) } : {}),
            ...(text(values.delivery_instructions) ? { DeliveryInstructions: text(values.delivery_instructions) } : {}),
            ...(values.line_amount_types ? { LineAmountTypes: values.line_amount_types } : {}),
            ...(text(values.currency_code) ? { CurrencyCode: text(values.currency_code) } : {}),
          },
        ],
      },
      operation: 'create purchase order',
    });
    return xeroApi.firstRecord({ body, key: 'PurchaseOrders', operation: 'create purchase order' });
  },
});
