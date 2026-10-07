import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient, SageAccountingRef } from '../client';
import { sageAccountingDropdowns } from '../common/dropdowns';
import { createPurchaseInvoiceActionOutputSchema } from '../output-schemas';

export const createPurchaseInvoiceAction = createAction({
  auth: sageAccountingAuth,
  name: 'create_purchase_invoice',
  classification: 'WRITE',
  displayName: 'Create Purchase Invoice',
  description: 'Creates a new purchase invoice (bill) in Sage Accounting.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a new purchase invoice owed to a vendor, with one or more ledger account lines. Each call creates a new invoice, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: createPurchaseInvoiceActionOutputSchema,
  props: {
    vendor: sageAccountingDropdowns.vendorById,
    date: Property.DateTime({ displayName: 'Invoice Date', required: true }),
    dueDate: Property.DateTime({ displayName: 'Due Date', required: true }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    vendorReference: Property.ShortText({ displayName: 'Vendor Reference', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    lines: Property.Array({
      displayName: 'Line Items',
      required: true,
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
    const { vendor, date, dueDate, reference, vendorReference, notes, lines } = context.propsValue;
    // Property.Array's `properties` sub-schema doesn't thread into propsValue's type (framework limitation).
    const lineItems = lines as InvoiceLineInput[];

    return await sageAccountingClient.apiCall<SageAccountingRef>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      path: sageAccountingClient.paths.purchaseInvoices,
      body: {
        purchase_invoice: {
          contact_id: vendor,
          date: sageAccountingClient.toDate(date),
          due_date: sageAccountingClient.toDate(dueDate),
          ...spreadIfDefined('reference', reference),
          ...spreadIfDefined('vendor_reference', vendorReference),
          ...spreadIfDefined('notes', notes),
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
