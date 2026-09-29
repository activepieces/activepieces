import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooRecords } from '../../common/records';
import { odooDates, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

async function toInvoiceLine({ client, line, index }: { client: OdooClient; line: unknown; index: number }) {
  if (!odooInput.isRecord(line)) throw new Error(`Line ${index + 1} must be an object.`);
  const label = `Line ${index + 1}`;
  const product = line['product'];
  const productId = product === undefined || product === null || product === '' ? undefined : await odooOperations.resolveProduct({ client, value: product, label: `${label} product` });
  const name = odooInput.optionalText(line['description']);
  if (!productId && !name) throw new Error(`${label} needs a product or a description.`);
  const taxIds = line['tax_ids'] === undefined ? undefined : odooInput.toIdList({ value: line['tax_ids'], label: `${label} tax_ids`, allowEmpty: true });
  return [
    0,
    0,
    odooInput.definedOnly({
      product_id: productId,
      name,
      quantity: odooInput.toOptionalNumber({ value: line['quantity'], label: `${label} quantity` }) ?? 1,
      price_unit: odooInput.toOptionalNumber({ value: line['price_unit'], label: `${label} price_unit` }),
      tax_ids: taxIds === undefined ? undefined : [[6, 0, taxIds]],
    }),
  ];
}

export const odooCreateInvoice = createAction({
  auth: odooAuth,
  name: 'odoo_create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Create a draft customer invoice, vendor bill or credit note in Odoo.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a draft Odoo invoice (account.move): customer invoice (default), vendor bill or credit note, for a partner with lines (product ID/reference and/or description, quantity, unit price, optional tax IDs). Post it with odoo_post_invoice. Needs Invoicing. Not idempotent: each call creates a new draft.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.invoice,
  props: {
    move_type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'out_invoice (default), in_invoice (vendor bill), out_refund, in_refund.',
      required: false,
      options: {
        options: [
          { label: 'Customer invoice', value: 'out_invoice' },
          { label: 'Vendor bill', value: 'in_invoice' },
          { label: 'Customer credit note', value: 'out_refund' },
          { label: 'Vendor refund', value: 'in_refund' },
        ],
      },
    }),
    partner_id: atomicProps.idProp({ displayName: 'Partner ID', description: 'Customer or vendor res.partner ID.' }),
    lines: Property.Json({
      displayName: 'Lines',
      description:
        'JSON list, for example [{"product": 12, "quantity": 2}, {"description": "Consulting", "quantity": 3, "price_unit": 150, "tax_ids": [1]}]. Omit tax_ids to use the product default taxes.',
      required: true,
    }),
    invoice_date: atomicProps.textProp({ displayName: 'Invoice Date', description: 'Date, for example 2026-09-29. Omit to set it when posting.' }),
    invoice_date_due: atomicProps.textProp({ displayName: 'Due Date', description: 'Date. Omit to use the payment terms.' }),
    ref: atomicProps.textProp({ displayName: 'Reference', description: 'Customer reference or vendor bill number.' }),
  },
  async run(context) {
    const p = context.propsValue;
    const rawLines = odooInput.parseArray({ value: p.lines, label: 'Lines' });
    if (rawLines.length === 0) throw new Error('Add at least one line.');
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const lines = await Promise.all(rawLines.map((line, index) => toInvoiceLine({ client, line, index })));
    const values = odooInput.definedOnly({
      move_type: odooInput.optionalText(p.move_type) ?? 'out_invoice',
      partner_id: odooInput.toId({ value: p.partner_id, label: 'Partner ID' }),
      invoice_date: odooDates.inputToOdooDate({ value: p.invoice_date, label: 'Invoice Date' }),
      invoice_date_due: odooDates.inputToOdooDate({ value: p.invoice_date_due, label: 'Due Date' }),
      ref: odooInput.optionalText(p.ref),
      invoice_line_ids: lines,
    });
    const id = await client.call<number>({ model: odooApps.invoice.model, method: 'create', args: [values] });
    return odooRecords.readApp({ client, model: odooApps.invoice.model, id, wanted: odooApps.invoice.fields, manyToOne: odooApps.invoice.manyToOne });
  },
});
