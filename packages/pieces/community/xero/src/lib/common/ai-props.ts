import { Property } from '@activepieces/pieces-framework';
import { xeroApi, xeroInput, xeroValue } from './client';

function tenantIdProp() {
  return Property.ShortText({
    displayName: 'Organisation ID',
    description:
      'Xero tenant ID of the organisation to use, from List Organisations. Leave empty when the connection has only one organisation.',
    required: false,
  });
}

function idProp({ displayName, description, required = true }: { displayName: string; description: string; required?: boolean }) {
  return Property.ShortText({ displayName, description, required });
}

function lineItemsProp({ required = true }: { required?: boolean } = {}) {
  return Property.Json({
    displayName: 'Line Items',
    description:
      'JSON array of line items, e.g. [{"Description":"Consulting","Quantity":2,"UnitAmount":150.5,"AccountCode":"200","TaxType":"OUTPUT"}]. Each line needs a Description or an ItemCode. Allowed keys: Description, Quantity, UnitAmount, LineAmount, AccountCode, ItemCode, TaxType, TaxAmount, DiscountRate, Tracking (array of {"Name","Option"}), LineItemID. Amounts keep up to 4 decimal places for UnitAmount and Quantity.',
    required,
  });
}

async function target({ accessToken, tenantId }: { accessToken: string; tenantId: unknown }) {
  return { accessToken, tenantId: await xeroApi.resolveTenantId({ accessToken, tenantId }) };
}

function parseJsonArray({ value, field }: { value: unknown; field: string }): unknown[] {
  const parsed = typeof value === 'string' ? safeJsonParse({ text: value, field }) : value;
  if (!Array.isArray(parsed)) throw new Error(`${field} must be a JSON array.`);
  return parsed;
}

function safeJsonParse({ text, field }: { text: string; field: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${field} is not valid JSON.`);
  }
}

function parseTracking({ value, field }: { value: unknown; field: string }) {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new Error(`${field} must be an array of {"Name","Option"} objects.`);
  return value.map((entry, index) => {
    if (!xeroValue.isRecord(entry)) throw new Error(`${field}[${index}] must be an object.`);
    const name = xeroValue.readString(entry['Name']);
    const option = xeroValue.readString(entry['Option']);
    const categoryId = xeroValue.readString(entry['TrackingCategoryID']);
    const optionId = xeroValue.readString(entry['TrackingOptionID']);
    if (!(name && option) && !(categoryId && optionId)) {
      throw new Error(`${field}[${index}] needs Name and Option (or TrackingCategoryID and TrackingOptionID).`);
    }
    return {
      ...(name ? { Name: name } : {}),
      ...(option ? { Option: option } : {}),
      ...(categoryId ? { TrackingCategoryID: categoryId } : {}),
      ...(optionId ? { TrackingOptionID: optionId } : {}),
    };
  });
}

function rejectUnknownKeys({ entry, allowed, field }: { entry: Record<string, unknown>; allowed: string[]; field: string }) {
  const unknown = Object.keys(entry).filter((key) => !allowed.includes(key));
  if (unknown.length > 0) {
    throw new Error(`${field} has unknown keys: ${unknown.join(', ')}. Allowed keys: ${allowed.join(', ')}.`);
  }
}

function optionalText({ entry, key }: { entry: Record<string, unknown>; key: string }) {
  const value = entry[key];
  if (value === undefined || value === null || value === '') return {};
  if (typeof value !== 'string' && typeof value !== 'number') throw new Error(`${key} must be text.`);
  const text = String(value).trim();
  return text.length > 0 ? { [key]: text } : {};
}

function optionalNumber({ entry, key, field, maxDecimals }: { entry: Record<string, unknown>; key: string; field: string; maxDecimals: number }) {
  const parsed = xeroInput.optionalDecimal({ value: entry[key], field: `${field}.${key}`, maxDecimals });
  return parsed === undefined ? {} : { [key]: parsed };
}

function parseLineItems({ value, field = 'Line Items', required = true }: { value: unknown; field?: string; required?: boolean }) {
  if (!required && (value === undefined || value === null || value === '')) return undefined;
  const entries = parseJsonArray({ value, field });
  if (entries.length === 0) throw new Error(`${field} must contain at least one line.`);
  if (entries.length > MAX_LINES) throw new Error(`${field} can contain at most ${MAX_LINES} lines.`);
  return entries.map((entry, index) => {
    const lineField = `${field}[${index}]`;
    if (!xeroValue.isRecord(entry)) throw new Error(`${lineField} must be an object.`);
    rejectUnknownKeys({ entry, allowed: LINE_ITEM_KEYS, field: lineField });
    const line: Record<string, unknown> = {
      ...optionalText({ entry, key: 'LineItemID' }),
      ...optionalText({ entry, key: 'Description' }),
      ...optionalNumber({ entry, key: 'Quantity', field: lineField, maxDecimals: 4 }),
      ...optionalNumber({ entry, key: 'UnitAmount', field: lineField, maxDecimals: 4 }),
      ...optionalNumber({ entry, key: 'LineAmount', field: lineField, maxDecimals: 2 }),
      ...optionalText({ entry, key: 'AccountCode' }),
      ...optionalText({ entry, key: 'ItemCode' }),
      ...optionalText({ entry, key: 'TaxType' }),
      ...optionalNumber({ entry, key: 'TaxAmount', field: lineField, maxDecimals: 2 }),
      ...optionalNumber({ entry, key: 'DiscountRate', field: lineField, maxDecimals: 2 }),
    };
    const tracking = parseTracking({ value: entry['Tracking'], field: `${lineField}.Tracking` });
    if (tracking) line['Tracking'] = tracking;
    if (line['Description'] === undefined && line['ItemCode'] === undefined && line['LineItemID'] === undefined) {
      throw new Error(`${lineField} needs a Description or an ItemCode.`);
    }
    return line;
  });
}

function parseJournalLines({ value, field = 'Journal Lines' }: { value: unknown; field?: string }) {
  const entries = parseJsonArray({ value, field });
  if (entries.length < 2) throw new Error(`${field} needs at least two lines (a debit and a credit).`);
  if (entries.length > MAX_LINES) throw new Error(`${field} can contain at most ${MAX_LINES} lines.`);
  const lines = entries.map((entry, index) => {
    const lineField = `${field}[${index}]`;
    if (!xeroValue.isRecord(entry)) throw new Error(`${lineField} must be an object.`);
    rejectUnknownKeys({ entry, allowed: JOURNAL_LINE_KEYS, field: lineField });
    const amount = xeroInput.parseDecimal({ value: entry['LineAmount'], field: `${lineField}.LineAmount`, maxDecimals: 2 });
    if (amount === 0) throw new Error(`${lineField}.LineAmount cannot be zero.`);
    const line: Record<string, unknown> = {
      LineAmount: amount,
      ...optionalText({ entry, key: 'AccountCode' }),
      ...optionalText({ entry, key: 'AccountID' }),
      ...optionalText({ entry, key: 'Description' }),
      ...optionalText({ entry, key: 'TaxType' }),
      ...optionalNumber({ entry, key: 'TaxAmount', field: lineField, maxDecimals: 2 }),
    };
    if (line['AccountCode'] === undefined && line['AccountID'] === undefined) {
      throw new Error(`${lineField} needs an AccountCode or an AccountID.`);
    }
    const tracking = parseTracking({ value: entry['Tracking'], field: `${lineField}.Tracking` });
    if (tracking) line['Tracking'] = tracking;
    return { line, amount };
  });
  const total = lines.reduce((sum, { amount }) => sum + xeroInput.toScaledInteger({ value: amount, decimals: 2 }), BigInt(0));
  if (total !== BigInt(0)) {
    const sign = total < BigInt(0) ? '-' : '';
    const absolute = total < BigInt(0) ? -total : total;
    const whole = absolute / BigInt(100);
    const cents = (absolute % BigInt(100)).toString().padStart(2, '0');
    throw new Error(
      `${field} must balance: debits (positive LineAmount) and credits (negative LineAmount) must add up to 0, but they add up to ${sign}${whole}.${cents}.`,
    );
  }
  return lines.map(({ line }) => line);
}

const MAX_LINES = 500;
const LINE_ITEM_KEYS = [
  'LineItemID',
  'Description',
  'Quantity',
  'UnitAmount',
  'LineAmount',
  'AccountCode',
  'ItemCode',
  'TaxType',
  'TaxAmount',
  'DiscountRate',
  'Tracking',
];
const JOURNAL_LINE_KEYS = ['LineAmount', 'AccountCode', 'AccountID', 'Description', 'TaxType', 'TaxAmount', 'Tracking'];

export const aiProps = {
  tenantId: tenantIdProp,
  id: idProp,
  lineItems: lineItemsProp,
};

export const aiInput = {
  target,
  parseLineItems,
  parseJournalLines,
  parseJsonArray,
};
