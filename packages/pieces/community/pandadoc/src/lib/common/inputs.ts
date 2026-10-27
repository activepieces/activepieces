import { isRecord } from './client';

function pickCustom({ value, custom }: { value: unknown; custom: unknown }): string | undefined {
  if (typeof value !== 'string' || value.length === 0) {
    return undefined;
  }
  if (value === 'custom') {
    return typeof custom === 'string' && custom.trim().length > 0 ? custom.trim() : undefined;
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredString({ value, label }: { value: unknown; label: string }): string {
  const result = optionalString(value);
  if (result === undefined) {
    throw new Error(`${label} is required.`);
  }
  return result;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function boundedCount({ value, label }: { value: unknown; label: string }): number | undefined {
  const count = optionalNumber(value);
  if (count === undefined) {
    return undefined;
  }
  if (!Number.isInteger(count) || count < 1 || count > 100) {
    throw new Error(`${label} must be a whole number between 1 and 100.`);
  }
  return count;
}

function positivePage(value: unknown): number | undefined {
  const page = optionalNumber(value);
  if (page === undefined) {
    return undefined;
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new Error('Page must be a whole number starting at 1.');
  }
  return page;
}

function stringRecord(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (item === undefined || item === null) {
        return [];
      }
      return [[key, typeof item === 'string' ? item : JSON.stringify(item)]];
    }),
  );
}

function fieldValues(value: unknown): Record<string, { value: string | number | boolean }> {
  if (!isRecord(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, item]) => {
      if (typeof item === 'boolean' || (typeof item === 'number' && Number.isFinite(item))) {
        return [[key, { value: item }]];
      }
      if (typeof item === 'string' && item.length > 0) {
        return [[key, { value: item }]];
      }
      if (isRecord(item) && ['string', 'number', 'boolean'].includes(typeof item['value'])) {
        const inner = item['value'];
        return typeof inner === 'string' || typeof inner === 'number' || typeof inner === 'boolean' ? [[key, { value: inner }]] : [];
      }
      return [];
    }),
  );
}

function tokenList(value: unknown): { name: string; value: string }[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (!isRecord(item)) {
        return [];
      }
      const name = optionalString(item['name']);
      const tokenValue = item['value'];
      return name === undefined || tokenValue === undefined || tokenValue === null ? [] : [{ name, value: String(tokenValue) }];
    });
  }
  return Object.entries(stringRecord(value)).map(([name, tokenValue]) => ({ name, value: tokenValue }));
}

function stringList(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter((item) => item.length > 0);
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    const text = optionalString(item);
    return text === undefined ? [] : [text];
  });
}

function recipients(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }
    const email = optionalString(item['email']);
    const phone = optionalString(item['phone']);
    if (email === undefined && phone === undefined) {
      throw new Error('Each recipient needs an email or a phone number.');
    }
    const role = pickCustom({ value: item['role'], custom: item['custom_role'] });
    const signingOrder = optionalNumber(item['signing_order']);
    return [
      {
        ...(email === undefined ? {} : { email }),
        ...(phone === undefined ? {} : { phone }),
        ...(optionalString(item['first_name']) === undefined ? {} : { first_name: optionalString(item['first_name']) }),
        ...(optionalString(item['last_name']) === undefined ? {} : { last_name: optionalString(item['last_name']) }),
        ...(role === undefined ? {} : { role }),
        ...(signingOrder === undefined ? {} : { signing_order: signingOrder }),
      },
    ];
  });
}

export function metadataQuery(value: unknown): Record<string, string> {
  return Object.fromEntries(
    Object.entries(stringRecord(value)).map(([key, item]) => [`metadata_${key}`, item]),
  );
}

export const pandadocInputs = {
  pickCustom,
  optionalString,
  requiredString,
  optionalNumber,
  boundedCount,
  positivePage,
  stringRecord,
  fieldValues,
  tokenList,
  stringList,
  recipients,
};
