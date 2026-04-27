import type { HintField, OutputDisplayHints } from './types';

function titleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveFieldLabel(field: HintField): string {
  return field.label ?? titleCase(field.key);
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
  titleCase,
  resolveFieldLabel,
  resolveFieldPath,
  resolveItemFieldPath,
  visibleFields,
};
