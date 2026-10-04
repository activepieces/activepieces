import { odooApps } from './app-fields';
import { OdooClient } from './client';
import { odooRecords } from './records';
import { Condition, Domain, odooDates, odooDomain, odooInput, odooOutput } from './values';

async function getRecord({ client, model, id, fields }: { client: OdooClient; model: string; id: number; fields?: string[] }) {
  const { names, map } = await odooRecords.resolveFields({ client, model, fields });
  const [record] = await odooRecords.readByIds({ client, model, ids: [id], fields: names, map });
  if (!record) throw new Error(`${model} record ${id} was not found.`);
  return { model, id, record };
}

async function deleteRecords({ client, model, ids }: { client: OdooClient; model: string; ids: number[] }) {
  await client.call<boolean>({ model, method: 'unlink', args: [ids] });
  return { success: true, model, deleted_ids: ids };
}

async function runMethod({
  client,
  model,
  method,
  ids,
  args,
  kwargs,
}: {
  client: OdooClient;
  model: string;
  method: string;
  ids: number[];
  args: unknown[];
  kwargs: Record<string, unknown>;
}) {
  const positional = ids.length > 0 ? [ids, ...args] : args;
  const result = await client.callAllowNone<unknown>({ model, method, args: positional, kwargs });
  return {
    model,
    method,
    record_ids: ids,
    returned_none: result.returnedNone,
    result: result.value,
  };
}

async function postMessage({
  client,
  model,
  recordId,
  body,
  kind,
  partnerIds,
}: {
  client: OdooClient;
  model: string;
  recordId: number;
  body: string;
  kind: 'note' | 'message';
  partnerIds: number[];
}) {
  const result = await client.call<unknown>({
    model,
    method: 'message_post',
    args: [[recordId]],
    kwargs: odooInput.definedOnly({
      body,
      message_type: 'comment',
      subtype_xmlid: kind === 'note' ? 'mail.mt_note' : 'mail.mt_comment',
      partner_ids: partnerIds.length > 0 ? partnerIds : undefined,
    }),
  });
  return { message_id: odooOutput.firstId(result), model, record_id: recordId, message_type: kind };
}

function fileToBase64(file: unknown): { base64: string; filename: string | null } {
  if (!odooInput.isRecord(file)) throw new Error('File is missing.');
  const data = file['data'];
  const filename = typeof file['filename'] === 'string' ? file['filename'] : null;
  if (Buffer.isBuffer(data)) return { base64: data.toString('base64'), filename };
  const base64 = file['base64'];
  if (typeof base64 === 'string' && base64.length > 0) return { base64, filename };
  throw new Error('File is missing or empty.');
}

async function attachFile({
  client,
  model,
  recordId,
  file,
  name,
  mimetype,
}: {
  client: OdooClient;
  model: string;
  recordId: number;
  file: unknown;
  name?: string;
  mimetype?: string;
}) {
  const { base64, filename } = fileToBase64(file);
  const fileName = name ?? filename ?? 'attachment';
  const id = await client.call<number>({
    model: odooApps.attachment.model,
    method: 'create',
    args: [odooInput.definedOnly({ name: fileName, datas: base64, res_model: model, res_id: recordId, mimetype })],
  });
  return odooRecords.readCreated({ client, model: odooApps.attachment.model, id, wanted: odooApps.attachment.fields });
}

async function resolveProducts({ client, refs }: { client: OdooClient; refs: ProductRef[] }): Promise<number[]> {
  const parsed = refs.map((ref) => parseProductRef(ref));
  const codes = Array.from(new Set(parsed.flatMap((ref) => (ref.text === null ? [] : [ref.text]))));
  const numeric = Array.from(new Set(codes.filter((code) => /^\d+$/.test(code)).map(Number)));
  const [byCode, byId] = await Promise.all([
    codes.length > 0
      ? client.call<Record<string, unknown>[]>({
          model: odooApps.product.model,
          method: 'search_read',
          args: [[['default_code', 'in', codes]]],
          kwargs: { fields: ['id', 'default_code'] },
        })
      : Promise.resolve([]),
    numeric.length > 0
      ? client.call<Record<string, unknown>[]>({ model: odooApps.product.model, method: 'search_read', args: [[['id', 'in', numeric]]], kwargs: { fields: ['id'] } })
      : Promise.resolve([]),
  ]);
  const codeMatches = new Map<string, number[]>();
  for (const row of Array.isArray(byCode) ? byCode : []) {
    const id = row['id'];
    const code = row['default_code'];
    if (typeof id === 'number' && typeof code === 'string') codeMatches.set(code, [...(codeMatches.get(code) ?? []), id]);
  }
  const knownIds = new Set((Array.isArray(byId) ? byId : []).flatMap((row) => (typeof row['id'] === 'number' ? [row['id']] : [])));
  return parsed.map((ref) => (ref.id !== null ? ref.id : pickProduct({ text: ref.text ?? '', label: ref.label, codeMatches, knownIds })));
}

function parseProductRef({ value, label }: ProductRef): { id: number | null; text: string | null; label: string } {
  if (typeof value === 'number') return { id: odooInput.toId({ value, label: `${label} ID` }), text: null, label };
  const text = String(value ?? '').trim();
  if (!text) throw new Error(`${label}: enter a product ID or internal reference.`);
  return { id: null, text, label };
}

function pickProduct({
  text,
  label,
  codeMatches,
  knownIds,
}: {
  text: string;
  label: string;
  codeMatches: Map<string, number[]>;
  knownIds: Set<number>;
}): number {
  const byCode = codeMatches.get(text) ?? [];
  if (byCode.length > 1) throw new Error(`${label}: more than one product has the internal reference "${text}". Use the product ID.`);
  const [codeMatch] = byCode;
  const idMatch = /^\d+$/.test(text) && knownIds.has(Number(text)) ? Number(text) : undefined;
  if (codeMatch !== undefined && idMatch !== undefined && codeMatch !== idMatch) {
    throw new Error(
      `${label}: "${text}" is the internal reference of product ${codeMatch} and also the ID of product ${idMatch}. Pass the ID as a number, or use the internal reference of the product you mean.`,
    );
  }
  const found = codeMatch ?? idMatch;
  if (found === undefined) throw new Error(`${label}: no product with ID or internal reference "${text}".`);
  return found;
}

function checkLineCount({ count, label }: { count: number; label: string }): void {
  if (count > MAX_LINES) throw new Error(`Add at most ${MAX_LINES} ${label} per call (got ${count}). Split the rest into another call.`);
}

async function createLead({ client, values }: { client: OdooClient; values: Record<string, unknown> }) {
  const id = await client.call<number>({ model: odooApps.lead.model, method: 'create', args: [values] });
  return odooRecords.readCreated({ client, model: odooApps.lead.model, id, wanted: odooApps.lead.fields, manyToOne: odooApps.lead.manyToOne });
}

async function createSaleOrder({
  client,
  partnerId,
  lines,
  values,
}: {
  client: OdooClient;
  partnerId: number;
  lines: SaleLineInput[];
  values: Record<string, unknown>;
}) {
  if (lines.length === 0) throw new Error('Add at least one order line.');
  checkLineCount({ count: lines.length, label: 'order lines' });
  const parsed = lines.map((line, index) => ({
    quantity: odooInput.toOptionalNumber({ value: line.quantity, label: `Line ${index + 1} quantity` }),
    price_unit: odooInput.toOptionalNumber({ value: line.price_unit, label: `Line ${index + 1} unit price` }),
    name: odooInput.optionalText(line.description),
  }));
  const productIds = await resolveProducts({ client, refs: lines.map((line, index) => ({ value: line.product, label: `Line ${index + 1} product` })) });
  const orderLines = parsed.map((line, index) => [
    0,
    0,
    odooInput.definedOnly({ product_id: productIds[index], product_uom_qty: line.quantity ?? 1, price_unit: line.price_unit, name: line.name }),
  ]);
  const id = await client.call<number>({
    model: odooApps.saleOrder.model,
    method: 'create',
    args: [{ ...values, partner_id: partnerId, order_line: orderLines }],
  });
  return odooRecords.readCreated({
    client,
    model: odooApps.saleOrder.model,
    id,
    wanted: odooApps.saleOrder.fields,
    manyToOne: odooApps.saleOrder.manyToOne,
  });
}

function invoiceDomain(filters: InvoiceFilters): Domain {
  const conditions: Condition[] = [];
  const moveTypes = filters.move_types.length > 0 ? filters.move_types : ['out_invoice', 'in_invoice', 'out_refund', 'in_refund'];
  conditions.push(['move_type', 'in', moveTypes]);
  if (filters.state) conditions.push(['state', '=', filters.state]);
  if (filters.payment_states.length > 0) conditions.push(['payment_state', 'in', filters.payment_states]);
  if (filters.partner_id) conditions.push(['partner_id', 'child_of', filters.partner_id]);
  const invoiceFrom = odooDates.inputToOdooDate({ value: filters.invoice_date_from, label: 'Invoice date from' });
  const invoiceTo = odooDates.inputToOdooDate({ value: filters.invoice_date_to, label: 'Invoice date to' });
  const dueFrom = odooDates.inputToOdooDate({ value: filters.due_date_from, label: 'Due date from' });
  const dueTo = odooDates.inputToOdooDate({ value: filters.due_date_to, label: 'Due date to' });
  if (invoiceFrom) conditions.push(['invoice_date', '>=', invoiceFrom]);
  if (invoiceTo) conditions.push(['invoice_date', '<=', invoiceTo]);
  if (dueFrom) conditions.push(['invoice_date_due', '>=', dueFrom]);
  if (dueTo) conditions.push(['invoice_date_due', '<=', dueTo]);
  const text = odooInput.optionalText(filters.number);
  const search: Domain = text ? odooDomain.orConditions([['name', 'ilike', text], ['ref', 'ilike', text], ['payment_reference', 'ilike', text]]) : [];
  return odooDomain.andDomains([conditions, search]);
}

async function findInvoices({
  client,
  filters,
  limit,
  offset,
}: {
  client: OdooClient;
  filters: InvoiceFilters;
  limit: number;
  offset: number;
}) {
  return odooRecords.findApp({
    client,
    model: odooApps.invoice.model,
    wanted: odooApps.invoice.fields,
    manyToOne: odooApps.invoice.manyToOne,
    domain: invoiceDomain(filters),
    limit,
    offset,
    order: 'invoice_date desc, id desc',
  });
}

const MAX_LINES = 200;

export const odooOperations = {
  getRecord,
  deleteRecords,
  runMethod,
  postMessage,
  attachFile,
  fileToBase64,
  resolveProducts,
  checkLineCount,
  MAX_LINES,
  createLead,
  createSaleOrder,
  invoiceDomain,
  findInvoices,
};

export type ProductRef = { value: unknown; label: string };

export type SaleLineInput = { product: unknown; quantity?: unknown; price_unit?: unknown; description?: unknown };

export type InvoiceFilters = {
  move_types: string[];
  state?: string;
  payment_states: string[];
  partner_id?: number;
  invoice_date_from?: unknown;
  invoice_date_to?: unknown;
  due_date_from?: unknown;
  due_date_to?: unknown;
  number?: unknown;
};
