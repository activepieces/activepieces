import { HttpMethod } from '@activepieces/pieces-common';
import { chargekeepClient } from './client';
import { chargekeepMappers } from './mappers';

const { isRecord, text, positiveId, compact } = chargekeepClient;

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function finiteNumber({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`);
  return n;
}

function isoDate({ value, label }: { value: unknown; label: string }): string | undefined {
  const s = text(value);
  if (s === undefined) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`${label} must be a valid date (ISO 8601, e.g. 2024-06-11T11:11:41Z).`);
  return d.toISOString();
}

async function importContact({ auth, body }: { auth: unknown; body: Record<string, unknown> }) {
  const res = await chargekeepClient.send({ auth, method: HttpMethod.POST, path: '/api/services/CRM/Import/ImportContact', body: compact(body) });
  return { res, mapped: () => chargekeepMappers.importedContact(res.result) };
}

type ProductInput = {
  type: unknown;
  name: unknown;
  code: unknown;
  description?: unknown;
  descriptionHtml?: unknown;
  logoUrl?: unknown;
  groupName?: unknown;
  currencyId?: unknown;
  price?: unknown;
  fee?: unknown;
  unit?: unknown;
  frequency?: unknown;
  signupFee?: unknown;
  cycles?: unknown;
  trialDayCount?: unknown;
  customPeriodCount?: unknown;
  customPeriodType?: unknown;
  gracePeriodDayCount?: unknown;
};

const PRODUCT_TYPES = ['General', 'Event', 'Subscription', 'Digital'];

function productBody(input: ProductInput): Record<string, unknown> {
  const type = text(input.type) ?? 'General';
  if (!PRODUCT_TYPES.includes(type)) throw new Error(`Product Type must be one of ${PRODUCT_TYPES.join(', ')}.`);
  const name = text(input.name);
  const code = text(input.code);
  if (!name) throw new Error('Product Name is required.');
  if (!code) throw new Error('SKU (product code) is required.');
  const price = finiteNumber({ value: type === 'Subscription' ? input.fee ?? input.price : input.price, label: type === 'Subscription' ? 'Subscription fee' : 'Price' });
  if (price === undefined) throw new Error(type === 'Subscription' ? 'Subscription fee is required for Subscription products.' : 'Price is required.');
  const priceOption =
    type === 'Subscription'
      ? {
          type: 'Subscription',
          frequency: text(input.frequency) ?? 'Monthly',
          fee: price,
          signupFee: finiteNumber({ value: input.signupFee, label: 'Signup Fee' }),
          cycles: finiteNumber({ value: input.cycles, label: 'No of cycles' }),
          trialDayCount: finiteNumber({ value: input.trialDayCount, label: 'Trial Days' }),
          customPeriodCount: finiteNumber({ value: input.customPeriodCount, label: 'Custom No of Period' }),
          customPeriodType: text(input.frequency) === 'Custom' ? text(input.customPeriodType) : undefined,
          gracePeriodDayCount: finiteNumber({ value: input.gracePeriodDayCount, label: 'Grace Period Count' }),
        }
      : { type: 'OneTime', unit: text(input.unit) ?? 'Unit', fee: price };
  return compact({
    code,
    name,
    type,
    description: text(input.description),
    descriptionHtml: text(input.descriptionHtml),
    logoUrl: text(input.logoUrl),
    groupName: text(input.groupName),
    currencyId: text(input.currencyId) ?? 'USD',
    priceOptions: [priceOption],
  });
}

async function importProduct({ auth, input }: { auth: unknown; input: ProductInput }) {
  const body = productBody(input);
  const res = await chargekeepClient.send({ auth, method: HttpMethod.POST, path: '/api/services/CRM/Import/ImportProduct', body });
  const productId = chargekeepMappers.num(res.result);
  if (productId === null) throw new Error('ChargeKeep did not return a product ID.');
  const mapped = async () => {
    try {
      const info = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Product/GetProductInfo', query: { id: productId } });
      return { ...chargekeepMappers.product(info), detailsError: null };
    } catch (error) {
      return { ...chargekeepMappers.product({ id: productId, code: body['code'], name: body['name'], type: body['type'], currencyId: body['currencyId'] }), detailsError: errorText(error) };
    }
  };
  return { res, mapped };
}

type InvoiceLine = { productCode?: unknown; description?: unknown; quantity?: unknown; rate?: unknown; total?: unknown; unitId?: unknown; commissionableAmount?: unknown; sortOrder?: unknown };
type Payment = { amount?: unknown; date?: unknown; description?: unknown; gatewayName?: unknown; gatewayTransactionId?: unknown };

type InvoiceInput = {
  contactId?: unknown;
  contactXref?: unknown;
  number: unknown;
  status: unknown;
  date?: unknown;
  dueDate: unknown;
  currencyId: unknown;
  description: unknown;
  note?: unknown;
  grandTotal?: unknown;
  discountTotal?: unknown;
  shippingTotal?: unknown;
  taxTotal?: unknown;
  billingAddress?: Record<string, unknown>;
  shippingAddress?: Record<string, unknown>;
  lines: InvoiceLine[];
  payment?: Payment;
  historicalData?: unknown;
};

const INVOICE_STATUSES = ['Draft', 'Final', 'Paid', 'Sent'];

function invoiceBody(input: InvoiceInput): Record<string, unknown> {
  const contactId = positiveId({ value: input.contactId, label: 'Contact ID' });
  const contactXref = text(input.contactXref);
  if (contactId === undefined && contactXref === undefined) throw new Error('Provide a Contact ID or an External Contact ID (XREF).');
  const number = text(input.number);
  if (!number) throw new Error('Invoice No. is required.');
  const status = text(input.status) ?? 'Draft';
  if (!INVOICE_STATUSES.includes(status)) throw new Error(`Status must be one of ${INVOICE_STATUSES.join(', ')}.`);
  if (input.lines.length === 0) throw new Error('Add at least one invoice line.');
  const lines = input.lines.map((line, i) => {
    const quantity = finiteNumber({ value: line.quantity, label: `Line ${i + 1} quantity` });
    if (quantity === undefined || quantity <= 0) throw new Error(`Line ${i + 1} quantity must be greater than 0.`);
    const rate = finiteNumber({ value: line.rate, label: `Line ${i + 1} rate` });
    const total = finiteNumber({ value: line.total, label: `Line ${i + 1} total` });
    return {
      quantity,
      rate,
      total: total ?? (rate !== undefined ? Math.round(quantity * rate * 100) / 100 : undefined),
      commissionableAmount: finiteNumber({ value: line.commissionableAmount, label: `Line ${i + 1} commissionable amount` }),
      unitId: text(line.unitId) ?? 'Unit',
      productCode: text(line.productCode),
      description: text(line.description),
      sortOrder: finiteNumber({ value: line.sortOrder, label: `Line ${i + 1} sort order` }) ?? i,
    };
  });
  const amount = finiteNumber({ value: input.payment?.amount, label: 'Payment amount' });
  const transactions =
    amount !== undefined && amount !== 0
      ? [
          {
            date: isoDate({ value: input.payment?.date, label: 'Transaction Date' }) ?? new Date().toISOString(),
            description: text(input.payment?.description),
            amount,
            gatewayName: text(input.payment?.gatewayName),
            gatewayTransactionId: text(input.payment?.gatewayTransactionId),
          },
        ]
      : undefined;
  const shippingTotal = finiteNumber({ value: input.shippingTotal, label: 'Shipping Total' });
  const taxTotal = finiteNumber({ value: input.taxTotal, label: 'Tax Total' });
  const discountTotal = finiteNumber({ value: input.discountTotal, label: 'Discount Total' });
  const lineSum = lines.reduce((sum, l) => sum + (l.total ?? 0), 0);
  const grandTotal = finiteNumber({ value: input.grandTotal, label: 'Grand Total' }) ?? Math.round((lineSum + (shippingTotal ?? 0) + (taxTotal ?? 0) - (discountTotal ?? 0)) * 100) / 100;
  const dueDate = isoDate({ value: input.dueDate, label: 'Due Date' });
  if (!dueDate) throw new Error('Due Date is required.');
  return compact({
    contactId,
    contactXref,
    status,
    number,
    date: isoDate({ value: input.date, label: 'Date of the Invoice' }) ?? new Date().toISOString(),
    dueDate,
    currencyId: text(input.currencyId) ?? 'USD',
    grandTotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    billingAddress: input.billingAddress,
    shippingAddress: input.shippingAddress,
    description: text(input.description),
    note: text(input.note),
    lines,
    transactions,
    historicalData: transactions ? input.historicalData === true : undefined,
  });
}

async function importInvoice({ auth, input }: { auth: unknown; input: InvoiceInput }) {
  const body = invoiceBody(input);
  const res = await chargekeepClient.send({ auth, method: HttpMethod.POST, path: '/api/services/CRM/Import/ImportInvoice', body });
  const invoiceId = chargekeepMappers.num(res.result);
  if (invoiceId === null) throw new Error('ChargeKeep did not return an invoice ID.');
  const mapped = async () => {
    try {
      const info = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Invoice/GetInvoiceInfo', query: { id: invoiceId } });
      return { ...chargekeepMappers.invoice(info), detailsError: null };
    } catch (error) {
      return { ...chargekeepMappers.invoice({ id: invoiceId, number: body['number'], status: body['status'], currencyId: body['currencyId'] }), detailsError: errorText(error) };
    }
  };
  return { res, mapped };
}

const PAYMENT_PERIODS = ['Monthly', 'Annual', 'LifeTime', 'OneTime', 'Custom'];

async function updateSubscription({ auth, input }: { auth: unknown; input: { contactId?: unknown; contactXref?: unknown; productId?: unknown; productCode: unknown; paymentPeriodType: unknown; hasRecurringBilling?: unknown } }) {
  const contactId = positiveId({ value: input.contactId, label: 'Contact ID' });
  const contactXref = text(input.contactXref);
  if (contactId === undefined && contactXref === undefined) throw new Error('Provide a Contact ID or an External Contact ID (XREF).');
  const productCode = text(input.productCode);
  if (!productCode) throw new Error('Product Code is required.');
  const paymentPeriodType = text(input.paymentPeriodType) ?? 'Monthly';
  if (!PAYMENT_PERIODS.includes(paymentPeriodType)) throw new Error(`Payment Period Type must be one of ${PAYMENT_PERIODS.join(', ')}.`);
  const body = compact({
    contactId,
    contactXref,
    products: [{ productId: positiveId({ value: input.productId, label: 'Product ID' }), productCode, paymentPeriodType, hasRecurringBilling: input.hasRecurringBilling === true }],
  });
  const res = await chargekeepClient.send({ auth, method: HttpMethod.PUT, path: '/api/services/CRM/OrderSubscription/Update', body });
  const mapped = async () => {
    let resolvedId: number | null = contactId ?? null;
    try {
      if (resolvedId === null) {
        const found = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Contact/GetContactData', query: { xref: contactXref } });
        resolvedId = isRecord(found) ? chargekeepMappers.num(found['id']) : null;
      }
      if (resolvedId === null) throw new Error('Could not resolve the contact ID from the XREF.');
      const history = await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/OrderSubscription/GetSubscriptionHistory', query: { contactId: resolvedId } });
      const matches = chargekeepMappers.records(history).filter((s) => typeof s['productCode'] === 'string' && s['productCode'].toLowerCase() === productCode.toLowerCase());
      const latest = matches.sort((a, b) => (chargekeepMappers.num(b['id']) ?? 0) - (chargekeepMappers.num(a['id']) ?? 0))[0];
      return { contactId: resolvedId, productCode, paymentPeriodType, subscription: latest ? chargekeepMappers.subscription(latest) : null, detailsError: latest ? null : 'The subscription was saved but was not found in the contact subscription history.' };
    } catch (error) {
      return { contactId: resolvedId, productCode, paymentPeriodType, subscription: null, detailsError: errorText(error) };
    }
  };
  return { res, mapped };
}

export const chargekeepServices = { importContact, importProduct, importInvoice, updateSubscription, finiteNumber, isoDate };
export type { InvoiceInput, InvoiceLine, ProductInput };
