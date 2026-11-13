import { createAction, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooOperations } from '../../common/operations';
import { odooRecords } from '../../common/records';
import { odooDates, odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

function toLineRecord({ line, index }: { line: unknown; index: number }): Record<string, unknown> {
  if (!odooInput.isRecord(line)) throw new Error(`Line ${index + 1} must be an object.`);
  if (!hasProduct(line) && !odooInput.optionalText(line['description'])) throw new Error(`Line ${index + 1} needs a product or a description.`);
  return line;
}

function hasProduct(line: Record<string, unknown>): boolean {
  const product = line['product'];
  return product !== undefined && product !== null && product !== '';
}

async function resolveLineProducts({ client, lines }: { client: OdooClient; lines: Record<string, unknown>[] }): Promise<(number | undefined)[]> {
  const withProduct = lines.flatMap((line, index) => (hasProduct(line) ? [{ index, ref: { value: line['product'], label: `Line ${index + 1} product` } }] : []));
  const ids = await odooOperations.resolveProducts({ client, refs: withProduct.map((entry) => entry.ref) });
  const byLine = new Map(withProduct.map((entry, position) => [entry.index, ids[position]]));
  return lines.map((_, index) => byLine.get(index));
}

function toInvoiceLine({ line, index, productId }: { line: Record<string, unknown>; index: number; productId: number | undefined }) {
  const label = `Line ${index + 1}`;
  const name = odooInput.optionalText(line['description']);
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
      'Creates a draft Odoo invoice (account.move): customer invoice (default), vendor bill or credit note, for a partner with up to 200 lines (product ID/reference and/or description, quantity, unit price, optional tax IDs). Post it with odoo_post_invoice. Needs Invoicing. Not idempotent: each call creates a new draft. If read_back_error is set, the record was created but could not be read back: do not create it again; read it with odoo_get_records using the returned id.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.createdInvoice,
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
    odooOperations.checkLineCount({ count: rawLines.length, label: 'lines' });
    const records = rawLines.map((line, index) => toLineRecord({ line, index }));
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    const productIds = await resolveLineProducts({ client, lines: records });
    const lines = records.map((line, index) => toInvoiceLine({ line, index, productId: productIds[index] }));
    const values = odooInput.definedOnly({
      move_type: odooInput.optionalText(p.move_type) ?? 'out_invoice',
      partner_id: odooInput.toId({ value: p.partner_id, label: 'Partner ID' }),
      invoice_date: odooDates.inputToOdooDate({ value: p.invoice_date, label: 'Invoice Date' }),
      invoice_date_due: odooDates.inputToOdooDate({ value: p.invoice_date_due, label: 'Due Date' }),
      ref: odooInput.optionalText(p.ref),
      invoice_line_ids: lines,
    });
    const id = await client.call<number>({ model: odooApps.invoice.model, method: 'create', args: [values] });
    return odooRecords.readCreated({ client, model: odooApps.invoice.model, id, wanted: odooApps.invoice.fields, manyToOne: odooApps.invoice.manyToOne });
  },
});
