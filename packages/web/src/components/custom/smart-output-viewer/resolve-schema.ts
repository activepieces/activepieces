import { stringUtils } from '@/lib/string-utils';

import type { OutputSchemaField } from './types';

function resolveFieldLabel(field: OutputSchemaField): string {
  return field.label ?? stringUtils.titleCase(field.key);
}

function resolveFieldPath(
  field: OutputSchemaField,
  parentPath?: string,
): string {
  if (field.value) return field.value;
  if (parentPath) return `${parentPath}.${field.key}`;
  return field.key;
}

function resolveItemFieldPath(field: OutputSchemaField): string {
  return field.value ?? field.key;
}

function isPrimitiveArray(value: unknown): value is Array<unknown> {
  if (!Array.isArray(value)) return false;
  return value.every((item) => item === null || typeof item !== 'object');
}

export const schemaUtils = {
  resolveFieldLabel,
  resolveFieldPath,
  resolveItemFieldPath,
  isPrimitiveArray,
};
