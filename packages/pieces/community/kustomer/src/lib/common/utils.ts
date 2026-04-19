import { KustomerJsonObject, KustomerJsonValue } from './types';

function parseRequiredString({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function parseJsonObject({
  value,
  fieldName,
}: {
  value: unknown;
  fieldName: string;
}): KustomerJsonObject {
  if (!isKustomerJsonObject(value)) {
    throw new Error(`${fieldName} must be a JSON object.`);
  }

  return value;
}

function isKustomerJsonObject(value: unknown): value is KustomerJsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isKustomerJsonValue);
}

function isKustomerJsonValue(value: unknown): value is KustomerJsonValue {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isKustomerJsonValue);
  }

  return isKustomerJsonObject(value);
}

export const kustomerUtils = {
  parseRequiredString,
  parseJsonObject,
};
