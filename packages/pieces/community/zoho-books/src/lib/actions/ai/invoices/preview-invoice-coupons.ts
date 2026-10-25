import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const previewInvoiceCouponsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_preview_invoice_coupons',
  displayName: 'Preview Invoice Coupons',
  description: 'Previews the effect of coupons on a Zoho Books invoice before it is created.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Previews the totals of an invoice with coupons applied, without creating it; use Create Invoice to create it afterwards. Needs coupons configured in Zoho Books.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    customerId: zohoBooksAiProps.contactId({
      required: true,
      displayName: 'Customer ID',
      description: 'Customer contact ID, from List Contacts or Create Contact.',
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description:
        'Line items of the invoice, e.g. [{"item_id": "982000000030049", "quantity": 2, "rate": 120, "description": "500GB hard drive"}].',
      required: true,
    }),
    currencyId: Property.ShortText({
      displayName: 'Currency ID',
      description: 'Currency of the invoice. Defaults to the currency of the customer.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'Invoice date as yyyy-mm-dd, e.g. "2026-11-01".',
      required: false,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other invoice fields, e.g. {"discount": "10%", "discount_type": "entity_level", "payment_terms": 15, "shipping_charge": "25.00", "custom_fields": [{"customfield_id": "46000000012845", "value": "Normal"}]}. The props above win over the same keys here.',
    }),
  },
  async run(context) {
    const { customerId, lineItems, currencyId, date, additionalFields } = context.propsValue;
    if (lineItems.length === 0) {
      throw new Error('Line Items must list at least one line item.');
    }
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/coupons/preview',
      query: { organization_id: organizationId },
      body: {
        ...additionalFields,
        customer_id: customerId,
        line_items: lineItems,
        ...spreadIfDefined('currency_id', currencyId),
        ...spreadIfDefined('date', date),
      },
    });
  },
});
