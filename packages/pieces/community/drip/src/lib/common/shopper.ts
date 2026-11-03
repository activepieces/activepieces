import { Property } from '@activepieces/pieces-framework';
import { dripApi } from './client';

const PROVIDER_PATTERN = /^[a-z0-9_]+$/;
const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;
const MAX_ITEMS = 1000;

export const shopperProps = {
  email: Property.ShortText({ displayName: 'Customer Email', description: 'Email of the customer. Either this or Drip Person ID is required.', required: false }),
  personId: Property.ShortText({ displayName: 'Drip Person ID', description: 'Drip subscriber ID of the customer. Used instead of the email when both are given.', required: false }),
  provider: Property.ShortText({
    displayName: 'Provider',
    description: 'Lower snake_case name of the store platform, e.g. shopify or my_store. Drip treats provider + ID as the unique key.',
    required: true,
    defaultValue: 'activepieces',
  }),
  initialStatus: Property.StaticDropdown({
    displayName: 'New Person Status',
    description: 'Status for a person Drip creates from this activity. Drip subscribes them (active) when left empty; choose Unsubscribed if they have not consented to marketing.',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Active (subscribed)', value: 'active' },
        { label: 'Unsubscribed', value: 'unsubscribed' },
      ],
    },
  }),
  occurredAt: Property.DateTime({ displayName: 'Occurred At', description: 'When it happened (ISO-8601). Defaults to now.', required: false }),
  currency: Property.ShortText({ displayName: 'Currency', description: 'ISO 4217 code, e.g. USD.', required: false }),
};

export const shopperInput = {
  person,
  provider,
  currency,
  amount,
  items,
  requestId,
};

function requestId(body: unknown): string | null {
  if (!dripApi.isRecord(body)) {
    return null;
  }
  if (typeof body['request_id'] === 'string') {
    return body['request_id'];
  }
  const ids = body['request_ids'];
  return Array.isArray(ids) && typeof ids[0] === 'string' ? ids[0] : null;
}

function person({ email, personId }: { email: unknown; personId: unknown }): Record<string, string> {
  const id = dripApi.optionalText(personId);
  if (id !== undefined) {
    return { person_id: id };
  }
  const address = dripApi.optionalText(email);
  if (address === undefined) {
    throw new Error('Customer Email or Drip Person ID is required.');
  }
  return { email: address };
}

function provider(value: unknown): string {
  const text = dripApi.requireText({ value, label: 'Provider' });
  if (!PROVIDER_PATTERN.test(text)) {
    throw new Error('Provider must be lower snake_case letters, digits and underscores, e.g. my_store.');
  }
  return text;
}

function currency(value: unknown): string | undefined {
  const text = dripApi.optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  if (!CURRENCY_PATTERN.test(text)) {
    throw new Error('Currency must be a 3-letter ISO 4217 code, e.g. USD.');
  }
  return text.toUpperCase();
}

function amount({ value, label }: { value: unknown; label: string }): number | undefined {
  return dripApi.validateNumber({ value, label, min: 0 });
}

function items({ value, required }: { value: unknown; required: string[] }): Record<string, unknown>[] | undefined {
  const list = dripApi.parseArray({ value, label: 'Items' });
  if (list === undefined) {
    return undefined;
  }
  if (list.length > MAX_ITEMS) {
    throw new Error(`Items can contain at most ${MAX_ITEMS} entries.`);
  }
  return list.map((item, index) => {
    if (!dripApi.isRecord(item)) {
      throw new Error(`Item #${index + 1} must be an object.`);
    }
    const missing = required.filter((key) => item[key] === undefined || item[key] === null || String(item[key]).trim() === '');
    if (missing.length > 0) {
      throw new Error(`Item #${index + 1} is missing ${missing.join(', ')}.`);
    }
    for (const key of ['price', 'quantity', 'discounts', 'taxes', 'fees', 'shipping', 'total']) {
      if (item[key] !== undefined && item[key] !== null) {
        const number = Number(item[key]);
        if (!Number.isFinite(number)) {
          throw new Error(`Item #${index + 1} ${key} must be a number.`);
        }
      }
    }
    return item;
  });
}
