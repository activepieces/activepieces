import { stringUtils } from '@/lib/string-utils';

import type { HintField, OutputDisplayHints } from './types';

function resolveFieldLabel(field: HintField): string {
  return field.label ?? stringUtils.titleCase(field.key);
}

function resolveFieldPath(field: HintField, parentPath?: string): string {
  if (field.value) return field.value;
  if (parentPath) return `${parentPath}.${field.key}`;
  return field.key;
}

function resolveItemFieldPath(field: HintField): string {
  return field.value ?? field.key;
}

function visibleFields(hints: OutputDisplayHints): {
  hero: HintField[];
  secondary: HintField[];
} {
  return {
    hero: hints.hero ?? [],
    secondary: hints.secondary ?? [],
  };
}

export const hintUtils = {
  resolveFieldLabel,
  resolveFieldPath,
  resolveItemFieldPath,
  visibleFields,
};
