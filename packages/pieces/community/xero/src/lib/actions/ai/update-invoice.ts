import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput, xeroValue } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroUpdateInvoiceAi = createAction({
  auth: xeroAuth,
  name: 'xero_update_invoice_ai',
  classification: 'WRITE',
  displayName: 'Update Invoice or Bill',
  description: 'Updates fields or line items of an existing invoice or bill by ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates an existing invoice or bill by InvoiceID: reference, dates, invoice number, contact, status (DRAFT, SUBMITTED or AUTHORISED) and line items. Line items replace the whole set unless Merge Line Items is on, which keeps existing lines, updates those whose LineItemID you pass and appends the rest. DRAFT and SUBMITTED invoices are fully editable; AUTHORISED ones only partly. Use Void or Delete Invoice to cancel one. Not idempotent when lines are appended; field-only changes converge.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.invoice,
  props: {
    tenant_id: aiProps.tenantId(),
    invoice_id: aiProps.id({ displayName: 'Invoice ID', description: 'Xero InvoiceID (a GUID) of the invoice or bill to update.' }),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    date: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date (YYYY-MM-DD)', required: false }),
    invoice_number: Property.ShortText({ displayName: 'Invoice Number', required: false }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Move the invoice to this ContactID.', required: false }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: [{ label: 'Draft', value: 'DRAFT' }, { label: 'Submitted for approval', value: 'SUBMITTED' }, { label: 'Authorised', value: 'AUTHORISED' }] },
    }),
    line_items: aiProps.lineItems({ required: false }),
    merge_line_items: Property.Checkbox({
      displayName: 'Merge Line Items',
      description: 'Keep the existing lines, update lines whose LineItemID is given and append new ones. Off replaces all lines.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const values = context.propsValue;
    const invoiceId = xeroInput.requiredText({ value: values.invoice_id, field: 'Invoice ID' });
    const lineItems = aiInput.parseLineItems({ value: values.line_items, required: false });
    const date = xeroInput.parseDateInput({ value: values.date, field: 'Date' });
    const dueDate = xeroInput.parseDateInput({ value: values.due_date, field: 'Due Date' });
    const text = (value: unknown) => xeroInput.trimmedOrUndefined({ value });
    const changes = {
      ...(text(values.reference) ? { Reference: text(values.reference) } : {}),
      ...(date ? { Date: date } : {}),
      ...(dueDate ? { DueDate: dueDate } : {}),
      ...(text(values.invoice_number) ? { InvoiceNumber: text(values.invoice_number) } : {}),
      ...(text(values.contact_id) ? { Contact: { ContactID: text(values.contact_id) } } : {}),
      ...(values.status ? { Status: values.status } : {}),
    };
    if (Object.keys(changes).length === 0 && lineItems === undefined) {
      throw new Error('Nothing to update: pass at least one field or Line Items.');
    }
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    const url = `${XERO_URLS.api}/Invoices/${encodeURIComponent(invoiceId)}`;
    const finalLines =
      lineItems && values.merge_line_items
        ? mergeLines({
            existing: xeroValue.readRecords(
              xeroApi.firstRecord({
                body: await xeroApi.request<unknown>({ accessToken, tenantId, method: HttpMethod.GET, url, queryParams: { unitdp: '4' }, operation: 'get invoice' }),
                key: 'Invoices',
                operation: 'get invoice',
              })['LineItems'],
            ),
            updates: lineItems,
          })
        : lineItems;
    const body = await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.POST,
      url,
      queryParams: { unitdp: '4' },
      body: { Invoices: [{ ...changes, ...(finalLines ? { LineItems: finalLines } : {}) }] },
      operation: 'update invoice',
    });
    return xeroApi.firstRecord({ body, key: 'Invoices', operation: 'update invoice' });
  },
});

function mergeLines({ existing, updates }: { existing: Record<string, unknown>[]; updates: Record<string, unknown>[] }) {
  const updatesById = new Map(
    updates.flatMap((line): [string, Record<string, unknown>][] => {
      const id = xeroValue.readString(line['LineItemID']);
      return id ? [[id, line]] : [];
    }),
  );
  const kept = existing.map((line) => {
    const id = xeroValue.readString(line['LineItemID']);
    const update = id ? updatesById.get(id) : undefined;
    return update ? { ...withoutStaleTotals({ line: pickLine({ line }), update }), ...update } : pickLine({ line });
  });
  const existingIds = new Set(existing.map((line) => xeroValue.readString(line['LineItemID'])).filter((id) => id !== undefined));
  const appended = updates.filter((line) => {
    const id = xeroValue.readString(line['LineItemID']);
    return id === undefined || !existingIds.has(id);
  });
  return [...kept, ...appended];
}

function withoutStaleTotals({ line, update }: { line: Record<string, unknown>; update: Record<string, unknown> }) {
  const touches = (keys: string[]) => keys.some((key) => update[key] !== undefined);
  const dropLineAmount = touches(LINE_AMOUNT_INPUTS);
  const dropTaxAmount = dropLineAmount || touches(TAX_AMOUNT_INPUTS);
  return Object.fromEntries(
    Object.entries(line).filter(([key]) => !(dropLineAmount && key === 'LineAmount') && !(dropTaxAmount && key === 'TaxAmount')),
  );
}

function pickLine({ line }: { line: Record<string, unknown> }) {
  return Object.fromEntries(Object.entries(line).filter(([key]) => LINE_KEYS.includes(key)));
}

const LINE_KEYS = ['LineItemID', 'Description', 'Quantity', 'UnitAmount', 'AccountCode', 'ItemCode', 'TaxType', 'TaxAmount', 'LineAmount', 'DiscountRate', 'Tracking'];
const LINE_AMOUNT_INPUTS = ['Quantity', 'UnitAmount', 'DiscountRate'];
const TAX_AMOUNT_INPUTS = ['LineAmount', 'TaxType'];
