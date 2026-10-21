import { createAction, Property } from '@activepieces/pieces-framework';
import { chargekeepAuth } from '../../auth';
import { chargekeepClient } from '../../common/client';
import { chargekeepOutputSchemas } from '../../common/output-schemas';
import { chargekeepServices, InvoiceLine } from '../../common/services';

function linesOf(value: unknown): InvoiceLine[] {
  if (!Array.isArray(value)) throw new Error('Lines must be a JSON array of objects, e.g. [{"productCode":"SKU1","quantity":1,"rate":10}].');
  return value.map((line, i) => {
    if (!chargekeepClient.isRecord(line)) throw new Error(`Line ${i + 1} must be an object.`);
    return line;
  });
}

export const createInvoiceAi = createAction({
  auth: chargekeepAuth,
  name: 'create_invoice',
  classification: 'WRITE',
  displayName: 'Create or Update Invoice',
  description: 'Create an invoice with one or more lines, or update the invoice with the same number.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates or updates one invoice in ChargeKeep/Sperse CRM for a contact (contactId or contactXref). invoiceNumber is the upsert key: reusing it overwrites that invoice. status is Draft (default), Final, Sent or Paid; setting it does not email the customer. lines is a JSON array of {productCode?, description?, quantity, rate?, total?, unitId?}; total defaults to quantity x rate, unitId to Unit, and grandTotal to the line sum plus shipping and tax minus discount. A payment is recorded only when paymentAmount is given, so retrying with a payment can record it twice. Dates are ISO 8601; date defaults to now. Returns the saved invoice with its lines.',
    idempotent: false,
  },
  outputSchema: chargekeepOutputSchemas.invoice,
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', required: false }),
    contactXref: Property.ShortText({ displayName: 'Contact XREF', required: false }),
    invoiceNumber: Property.ShortText({ displayName: 'Invoice Number', required: true }),
    status: Property.ShortText({ displayName: 'Status', description: 'Draft, Final, Sent or Paid. Defaults to Draft.', required: false }),
    currencyId: Property.ShortText({ displayName: 'Currency', description: 'ISO 4217 code. Defaults to USD.', required: false }),
    date: Property.ShortText({ displayName: 'Invoice Date', description: 'ISO 8601. Defaults to now.', required: false }),
    dueDate: Property.ShortText({ displayName: 'Due Date', description: 'ISO 8601.', required: true }),
    description: Property.LongText({ displayName: 'Description', required: true }),
    note: Property.LongText({ displayName: 'Note', required: false }),
    lines: Property.Json({ displayName: 'Lines', description: 'Array of {productCode, description, quantity, rate, total, unitId}.', required: true }),
    grandTotal: Property.Number({ displayName: 'Grand Total', description: 'Defaults to the sum of line totals plus shipping and tax, minus discount.', required: false }),
    discountTotal: Property.Number({ displayName: 'Discount Total', required: false }),
    shippingTotal: Property.Number({ displayName: 'Shipping Total', required: false }),
    taxTotal: Property.Number({ displayName: 'Tax Total', required: false }),
    paymentAmount: Property.Number({ displayName: 'Payment Amount', description: 'Records a payment of this amount on the invoice.', required: false }),
    paymentDate: Property.ShortText({ displayName: 'Payment Date', description: 'ISO 8601. Defaults to now.', required: false }),
    paymentGatewayName: Property.ShortText({ displayName: 'Payment Gateway Name', required: false }),
    paymentGatewayTransactionId: Property.ShortText({ displayName: 'Payment Gateway Transaction ID', required: false }),
    historicalPayment: Property.Checkbox({ displayName: 'Historical Payment', description: 'True when the payment is a past record, not a live transaction.', required: false }),
  },
  async run({ auth, propsValue: p }) {
    const { mapped } = await chargekeepServices.importInvoice({
      auth,
      input: {
        contactId: p.contactId,
        contactXref: p.contactXref,
        number: p.invoiceNumber,
        status: p.status,
        currencyId: p.currencyId,
        date: p.date,
        dueDate: p.dueDate,
        description: p.description,
        note: p.note,
        lines: linesOf(p.lines),
        grandTotal: p.grandTotal,
        discountTotal: p.discountTotal,
        shippingTotal: p.shippingTotal,
        taxTotal: p.taxTotal,
        payment: { amount: p.paymentAmount, date: p.paymentDate, gatewayName: p.paymentGatewayName, gatewayTransactionId: p.paymentGatewayTransactionId },
        historicalData: p.historicalPayment === true,
      },
    });
    return mapped();
  },
});
