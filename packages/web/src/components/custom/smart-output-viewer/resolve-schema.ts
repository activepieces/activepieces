import { isNil } from '@activepieces/shared';

import { pathUtils } from '@/lib/path-utils';
import { stringUtils } from '@/lib/string-utils';

import type { OutputSchema, OutputSchemaField } from './types';

function resolveFieldLabel(field: OutputSchemaField): string {
  return field.label ?? stringUtils.titleCase(field.key);
}

function resolveEntryLabel({
  value,
  labelKey,
  fallback,
}: {
  value: unknown;
  labelKey: string | undefined;
  fallback: string;
}): string {
  if (isNil(labelKey)) return fallback;
  const resolved = pathUtils.getValueByDotPath(value, labelKey);
  if (isNil(resolved) || typeof resolved === 'object') return fallback;
  const label = String(resolved);
  return label.length > 0 ? label : fallback;
}

function resolveTemplateLabel({
  value,
  template,
  fallback,
}: {
  value: unknown;
  template: string;
  fallback: string;
}): string {
  const label = template.replace(/\{([^}]+)\}/g, (_, path: string) => {
    const resolved = pathUtils.getValueByDotPath(value, path.trim());
    if (isNil(resolved) || typeof resolved === 'object') return '';
    return String(resolved);
  });
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : fallback;
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

function isMatrixArray(value: unknown): value is unknown[][] {
  if (!Array.isArray(value) || value.length === 0) return false;
  // Only scalar grids (e.g. Google Sheets `values`) get the row/cell treatment.
  // Arrays of arrays whose cells are objects fall through to the generic drill,
  // which can render those objects instead of stringifying them.
  return value.every((row) => isPrimitiveArray(row));
}

function isWholeOutputSchema(schema: OutputSchema): boolean {
  const fields = schema.fields ?? [];
  return fields.length === 1 && fields[0].value === '';
}

export const schemaUtils = {
  resolveFieldLabel,
  resolveEntryLabel,
  resolveTemplateLabel,
  resolveFieldPath,
  resolveItemFieldPath,
  isPrimitiveArray,
  isMatrixArray,
  isWholeOutputSchema,
};
