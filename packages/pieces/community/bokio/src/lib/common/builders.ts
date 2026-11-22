import { bokioClient } from './client';

function requireDate({ value, field }: { value: unknown; field: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!DATE_PATTERN.test(text)) {
    throw new Error(`${field} must be a date in YYYY-MM-DD format (got "${String(value ?? '')}").`);
  }
  const parsed = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== text) {
    throw new Error(`${field} is not a valid calendar date: "${text}".`);
  }
  return text;
}

function optionalDate({ value, field }: { value: unknown; field: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireDate({ value, field });
}

function requireUuid({ value, kind }: { value: unknown; kind: IdKind }): string {
  const text = typeof value === 'string' ? value.trim() : String(value ?? '').trim();
  if (!UUID_PATTERN.test(text)) {
    throw new Error(`${ID_HINTS[kind].label} must be a Bokio UUID (got "${text}"). ${ID_HINTS[kind].hint}`);
  }
  return text;
}

function optionalUuid({ value, kind }: { value: unknown; kind: IdKind }): string | undefined {
  return optionalText(value) === undefined ? undefined : requireUuid({ value, kind });
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function requireNumber({ value, field }: { value: unknown; field: string }): number {
  const parsed = bokioClient.toOptionalNumber(value);
  if (parsed === undefined) {
    throw new Error(`${field} is required and must be a number.`);
  }
  return parsed;
}

function optionalInteger({ value, field }: { value: unknown; field: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = bokioClient.toOptionalNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed)) {
    throw new Error(`${field} must be a whole number (got "${String(value)}").`);
  }
  return parsed;
}

function normalizeItemType(value: unknown): ItemType {
  if (value === 'salesItem') {
    return 'salesItem';
  }
  if (value === 'descriptionOnlyItem' || value === 'text') {
    return 'descriptionOnlyItem';
  }
  throw new Error(`Item type must be "salesItem" or "descriptionOnlyItem" (got "${String(value ?? '')}").`);
}

function normalizeProductType(value: unknown): ProductType | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (value === 'goods') {
    return 'goods';
  }
  if (value === 'services' || value === 'service') {
    return 'services';
  }
  throw new Error(`Product type must be "goods" or "services" (got "${String(value)}").`);
}

function buildSalesLineItem(input: LineItemInput): BokioLineItem {
  const itemType = normalizeItemType(input.itemType);
  const description = optionalText(input.description);
  if (itemType === 'descriptionOnlyItem') {
    if (!description) {
      throw new Error('Description is required for a description-only line.');
    }
    return { itemType, description };
  }
  const itemId = optionalUuid({ value: input.itemId, kind: 'item' });
  const productType = normalizeProductType(input.productType);
  const unitType = optionalText(input.unitType);
  const taxRate = bokioClient.toOptionalNumber(input.taxRate);
  const bookkeepingAccountNumber = optionalInteger({
    value: input.bookkeepingAccountNumber,
    field: 'Bookkeeping account number',
  });
  if (!itemId) {
    const missing = [
      description ? undefined : 'description',
      productType ? undefined : 'product type',
      taxRate === undefined ? 'tax rate' : undefined,
    ].filter((entry): entry is string => entry !== undefined);
    if (missing.length > 0) {
      throw new Error(
        `A sales line without an item ID needs: ${missing.join(', ')}.`
      );
    }
  }
  return {
    itemType,
    quantity: requireNumber({ value: input.quantity, field: 'Quantity' }),
    unitPrice: requireNumber({ value: input.unitPrice, field: 'Unit price' }),
    ...(description ? { description } : {}),
    ...(productType ? { productType } : {}),
    ...(unitType ? { unitType } : {}),
    ...(taxRate !== undefined ? { taxRate } : {}),
    ...(bookkeepingAccountNumber !== undefined ? { bookkeepingAccountNumber } : {}),
    ...(itemId ? { itemRef: { id: itemId } } : {}),
  };
}

function buildInvoiceBody(input: InvoiceInput): Record<string, unknown> {
  const customerId = optionalUuid({ value: input.customerId, kind: 'customer' });
  const dueDate = optionalDate({ value: input.dueDate, field: 'Due date' });
  const currency = optionalText(input.currency);
  const currencyRate = bokioClient.toOptionalNumber(input.currencyRate);
  const orderNumberReference = optionalText(input.orderNumberReference);
  return {
    type: 'invoice',
    invoiceDate: requireDate({ value: input.invoiceDate, field: 'Invoice date' }),
    ...(dueDate ? { dueDate } : {}),
    ...(customerId ? { customerRef: { id: customerId } } : {}),
    ...(currency ? { currency: currency.toUpperCase() } : {}),
    ...(currencyRate !== undefined ? { currencyRate } : {}),
    ...(orderNumberReference ? { orderNumberReference } : {}),
    lineItems: input.lineItems,
  };
}

function buildItemBody(input: ItemInput): Record<string, unknown> {
  const itemType = normalizeItemType(input.itemType);
  const description = optionalText(input.description);
  if (!description) {
    throw new Error('Description is required.');
  }
  if (description.length > 500) {
    throw new Error('Description must be at most 500 characters.');
  }
  if (itemType === 'descriptionOnlyItem') {
    return { itemType, description };
  }
  const productType = normalizeProductType(input.productType);
  const unitType = optionalText(input.unitType);
  const taxRate = bokioClient.toOptionalNumber(input.taxRate);
  const missing = [
    productType ? undefined : 'product type',
    unitType ? undefined : 'unit type',
    taxRate === undefined ? 'tax rate' : undefined,
  ].filter((entry): entry is string => entry !== undefined);
  if (missing.length > 0) {
    throw new Error(`A sales item needs: ${missing.join(', ')}.`);
  }
  const bookkeepingAccountNumber = optionalInteger({
    value: input.bookkeepingAccountNumber,
    field: 'Bookkeeping account number',
  });
  return {
    itemType,
    description,
    productType,
    unitType,
    unitPrice: requireNumber({ value: input.unitPrice, field: 'Unit price' }),
    taxRate,
    ...(bookkeepingAccountNumber !== undefined ? { bookkeepingAccountNumber } : {}),
  };
}

function buildCustomerBody(input: CustomerInput): Record<string, unknown> {
  const name = optionalText(input.name);
  if (!name) {
    throw new Error('Customer name is required.');
  }
  if (input.type !== 'company' && input.type !== 'private') {
    throw new Error('Customer type must be "company" or "private".');
  }
  const email = optionalText(input.email);
  const phone = optionalText(input.phone);
  const contactName = optionalText(input.contactName);
  const line1 = optionalText(input.line1);
  const line2 = optionalText(input.line2);
  const postalCode = optionalText(input.postalCode);
  const city = optionalText(input.city);
  const country = optionalText(input.country);
  const anyAddress = [line1, line2, postalCode, city, country].some((v) => v !== undefined);
  if (anyAddress) {
    const missing = [
      line1 ? undefined : 'address line 1',
      postalCode ? undefined : 'zip code',
      city ? undefined : 'city',
      country ? undefined : 'country',
    ].filter((entry): entry is string => entry !== undefined);
    if (missing.length > 0) {
      throw new Error(`An address needs all of: ${missing.join(', ')}.`);
    }
    if (country && !/^[A-Za-z]{2}$/.test(country)) {
      throw new Error('Country must be a two-letter ISO 3166-1 code, for example SE.');
    }
  }
  const language = optionalText(input.language);
  if (language && language !== 'sv' && language !== 'en') {
    throw new Error('Language must be "sv" or "en".');
  }
  const vatNumber = optionalText(input.vatNumber);
  const orgNumber = optionalText(input.orgNumber);
  const customerNumber = optionalText(input.customerNumber);
  const paymentTerms = optionalText(input.paymentTerms);
  return {
    name,
    type: input.type,
    ...(vatNumber ? { vatNumber } : {}),
    ...(orgNumber ? { orgNumber } : {}),
    ...(customerNumber ? { customerNumber } : {}),
    ...(paymentTerms ? { paymentTerms } : {}),
    ...(language ? { language } : {}),
    ...(email || phone
      ? {
          contactsDetails: [
            {
              name: contactName ?? name,
              ...(email ? { email } : {}),
              ...(phone ? { phone } : {}),
              isDefault: true,
            },
          ],
        }
      : {}),
    ...(anyAddress
      ? {
          address: {
            line1,
            ...(line2 ? { line2 } : {}),
            postalCode,
            city,
            country: country?.toUpperCase(),
          },
        }
      : {}),
  };
}

function parseJournalLines(raw: unknown): JournalLine[] {
  let parsed: unknown = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Lines must be a JSON array, for example [{"account":1930,"debit":100},{"account":3001,"credit":100}].');
    }
  }
  if (!Array.isArray(parsed) || parsed.length < 2) {
    throw new Error('Lines must be a JSON array with at least two lines.');
  }
  return parsed.map((entry, index) => {
    const label = `Line ${index + 1}`;
    if (!bokioClient.isRecord(entry)) {
      throw new Error(`${label} must be an object with account and debit or credit.`);
    }
    const account = bokioClient.toOptionalNumber(entry['account']);
    if (account === undefined || !Number.isInteger(account) || account <= 0) {
      throw new Error(`${label}: account must be a positive whole account number, for example 1930.`);
    }
    const debit = bokioClient.toOptionalNumber(entry['debit']) ?? 0;
    const credit = bokioClient.toOptionalNumber(entry['credit']) ?? 0;
    if (debit < 0 || credit < 0) {
      throw new Error(`${label}: debit and credit cannot be negative.`);
    }
    if ((debit > 0) === (credit > 0)) {
      throw new Error(`${label}: set exactly one of debit or credit to a positive amount.`);
    }
    return { account, debit, credit };
  });
}

function buildJournalBody(input: JournalInput): Record<string, unknown> {
  const title = optionalText(input.title);
  if (!title) {
    throw new Error('Title is required for a journal entry.');
  }
  const items = parseJournalLines(input.lines);
  const toCents = (amount: number): number => Math.round(amount * 100);
  const debitCents = items.reduce((sum, line) => sum + toCents(line.debit), 0);
  const creditCents = items.reduce((sum, line) => sum + toCents(line.credit), 0);
  if (debitCents !== creditCents) {
    throw new Error(
      `Debits (${(debitCents / 100).toFixed(2)}) must equal credits (${(creditCents / 100).toFixed(2)}).`
    );
  }
  return {
    title,
    date: requireDate({ value: input.date, field: 'Date' }),
    items,
  };
}

function mergeInvoiceForUpdate({
  existing,
  changes,
}: {
  existing: unknown;
  changes: InvoiceChanges;
}): Record<string, unknown> {
  if (!bokioClient.isRecord(existing)) {
    throw new Error('Bokio returned an unexpected invoice payload; nothing was updated.');
  }
  if (existing['status'] !== undefined && existing['status'] !== 'draft') {
    throw new Error(`Only draft invoices can be updated; this invoice is "${String(existing['status'])}".`);
  }
  const customerId = optionalUuid({ value: changes.customerId, kind: 'customer' });
  const invoiceDate = optionalDate({ value: changes.invoiceDate, field: 'Invoice date' });
  const dueDate = optionalDate({ value: changes.dueDate, field: 'Due date' });
  const currency = optionalText(changes.currency);
  const currencyRate = bokioClient.toOptionalNumber(changes.currencyRate);
  const orderNumberReference = optionalText(changes.orderNumberReference);
  return {
    ...existing,
    ...(customerId ? { customerRef: { id: customerId } } : {}),
    ...(invoiceDate ? { invoiceDate } : {}),
    ...(dueDate ? { dueDate } : {}),
    ...(currency ? { currency: currency.toUpperCase() } : {}),
    ...(currencyRate !== undefined ? { currencyRate } : {}),
    ...(orderNumberReference ? { orderNumberReference } : {}),
    ...(changes.lineItems !== undefined ? { lineItems: changes.lineItems } : {}),
  };
}

function parseLineItemsJson(raw: unknown): unknown[] | undefined {
  const text = optionalText(raw);
  if (!text) {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Line items must be valid JSON (an array of Bokio line items).');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Line items must be a non-empty JSON array.');
  }
  return parsed;
}

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const ID_HINTS: Record<IdKind, { label: string; hint: string }> = {
  customer: { label: 'Customer ID', hint: 'Get it from Find Customer.' },
  invoice: { label: 'Invoice ID', hint: 'Get it from List Invoices.' },
  item: { label: 'Item ID', hint: 'Get it from List Items.' },
  journalEntry: { label: 'Journal entry ID', hint: 'Get it from List Journal Entries.' },
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const bokioBuilders = {
  requireDate,
  optionalDate,
  optionalText,
  requireUuid,
  optionalUuid,
  buildSalesLineItem,
  buildInvoiceBody,
  buildItemBody,
  buildCustomerBody,
  buildJournalBody,
  parseJournalLines,
  mergeInvoiceForUpdate,
  parseLineItemsJson,
};

export type IdKind = 'customer' | 'invoice' | 'item' | 'journalEntry';
export type ItemType = 'salesItem' | 'descriptionOnlyItem';
export type ProductType = 'goods' | 'services';

export type BokioLineItem = {
  itemType: ItemType;
  description?: string;
  productType?: ProductType;
  unitType?: string;
  quantity?: number;
  unitPrice?: number;
  taxRate?: number;
  bookkeepingAccountNumber?: number;
  itemRef?: { id: string };
};

export type LineItemInput = {
  itemType: unknown;
  description?: unknown;
  itemId?: unknown;
  productType?: unknown;
  unitType?: unknown;
  quantity?: unknown;
  unitPrice?: unknown;
  taxRate?: unknown;
  bookkeepingAccountNumber?: unknown;
};

export type InvoiceInput = {
  invoiceDate: unknown;
  dueDate?: unknown;
  customerId?: unknown;
  currency?: unknown;
  currencyRate?: unknown;
  orderNumberReference?: unknown;
  lineItems: BokioLineItem[];
};

export type InvoiceChanges = {
  customerId?: unknown;
  invoiceDate?: unknown;
  dueDate?: unknown;
  currency?: unknown;
  currencyRate?: unknown;
  orderNumberReference?: unknown;
  lineItems?: unknown[];
};

export type ItemInput = {
  itemType: unknown;
  description?: unknown;
  productType?: unknown;
  unitType?: unknown;
  unitPrice?: unknown;
  taxRate?: unknown;
  bookkeepingAccountNumber?: unknown;
};

export type CustomerInput = {
  name: unknown;
  type: unknown;
  vatNumber?: unknown;
  orgNumber?: unknown;
  customerNumber?: unknown;
  paymentTerms?: unknown;
  language?: unknown;
  contactName?: unknown;
  email?: unknown;
  phone?: unknown;
  line1?: unknown;
  line2?: unknown;
  postalCode?: unknown;
  city?: unknown;
  country?: unknown;
};

export type JournalInput = {
  title: unknown;
  date: unknown;
  lines: unknown;
};

export type JournalLine = {
  account: number;
  debit: number;
  credit: number;
};
