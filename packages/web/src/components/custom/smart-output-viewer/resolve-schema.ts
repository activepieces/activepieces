import { isNil } from '@activepieces/shared';

import { pathUtils } from '@/lib/path-utils';
import { stringUtils } from '@/lib/string-utils';

import type { OutputSchemaField } from './types';

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
  return label.trim().length > 0 ? label : fallback;
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
  resolveEntryLabel,
  resolveTemplateLabel,
  resolveFieldPath,
  resolveItemFieldPath,
  isPrimitiveArray,
};
