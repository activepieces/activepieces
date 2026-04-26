import type { HintField, OutputDisplayHints } from './types';

function titleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveFieldLabel(field: HintField): string {
  return field.l ?? titleCase(field.k);
}

function resolveFieldPath(field: HintField, parentPath?: string): string {
  if (field.v) return field.v;
  if (parentPath) return `${parentPath}.${field.k}`;
  return field.k;
}

function resolveItemFieldPath(field: HintField): string {
  return field.v ?? field.k;
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
  titleCase,
  resolveFieldLabel,
  resolveFieldPath,
  resolveItemFieldPath,
  visibleFields,
};
