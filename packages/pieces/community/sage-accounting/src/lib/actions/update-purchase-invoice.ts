import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { updatePurchaseInvoiceActionOutputSchema } from '../output-schemas';

export const updatePurchaseInvoiceAction = createAction({
  auth: sageAccountingAuth,
  name: 'update_purchase_invoice',
  classification: 'WRITE',
  displayName: 'Update Purchase Invoice',
  description: 'Updates an existing purchase invoice (bill) in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update fields on an existing Sage Accounting purchase invoice, identified by its ID. Only the fields you provide are changed. Providing line items replaces the entire line list. Safe to retry with the same values.',
    idempotent: true,
  },
  outputSchema: updatePurchaseInvoiceActionOutputSchema,
  props: {
    invoice: sageAccountingDropdowns.purchaseInvoiceById,
    date: Property.DateTime({ displayName: 'Invoice Date', required: false }),
    dueDate: Property.DateTime({ displayName: 'Due Date', required: false }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    vendorReference: Property.ShortText({ displayName: 'Vendor Reference', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    lines: Property.Array({
      displayName: 'Line Items',
      description: 'Replaces the entire invoice line list. Leave blank to keep the existing lines.',
      required: false,
      properties: {
        ledgerAccountId: Property.ShortText({
          displayName: 'Ledger Account ID',
          description: 'The ledger account to post this line to. Find it under Settings > Chart of Accounts in Sage Accounting.',
          required: true,
        }),
        description: Property.ShortText({ displayName: 'Description', required: true }),
        quantity: Property.Number({ displayName: 'Quantity', required: true, defaultValue: 1 }),
        unitPrice: Property.Number({ displayName: 'Unit Price', required: true }),
        productId: Property.ShortText({
          displayName: 'Product Code (Product ID)',
          description: 'The product this line relates to, if any. Use the Find Product action to look up its ID.',
          required: false,
        }),
        taxRateId: Property.ShortText({
          displayName: 'Tax Rate ID',
          description: 'The tax rate to apply to this line. Find it under Settings > Tax Rates in Sage Accounting.',
          required: false,
        }),
        taxAmount: Property.Number({
          displayName: 'Tax Amount',
          description: 'Overrides the tax amount for this line. If left blank, Sage calculates it from the tax rate.',
          required: false,
        }),
        euGoodsServicesTypeId: Property.ShortText({
          displayName: 'EU Goods or Services Type ID',
          description: 'Find it under Settings > EU Goods or Services Types in Sage Accounting. Only relevant for EU cross-border purchases.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const { invoice, date, dueDate, reference, vendorReference, notes, lines } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as InvoiceLineInput[] | undefined;

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.PUT,
      path: `${sageAccountingClient.paths.purchaseInvoices}/${invoice}`,
      body: {
        purchase_invoice: {
          ...spreadIfDefined('date', date ? sageAccountingClient.toDate(date) : undefined),
          ...spreadIfDefined('due_date', dueDate ? sageAccountingClient.toDate(dueDate) : undefined),
          ...spreadIfDefined('reference', reference),
          ...spreadIfDefined('vendor_reference', vendorReference),
          ...spreadIfDefined('notes', notes),
          ...(lineItems?.length
            ? {
                invoice_lines: lineItems.map((line) => ({
                  ledger_account_id: line.ledgerAccountId,
                  description: line.description,
                  quantity: line.quantity ?? 1,
                  unit_price: line.unitPrice,
                  ...spreadIfDefined('product_id', line.productId),
                  ...spreadIfDefined('tax_rate_id', line.taxRateId),
                  ...spreadIfDefined('tax_amount', line.taxAmount),
                  ...spreadIfDefined('eu_goods_services_type_id', line.euGoodsServicesTypeId),
                })),
              }
            : {}),
        },
      },
    });
  },
});

type InvoiceLineInput = {
  ledgerAccountId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
  taxRateId?: string;
  taxAmount?: number;
  euGoodsServicesTypeId?: string;
};
