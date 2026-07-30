import { PieceProperty, PropertyType } from '@activepieces/pieces-framework';

function inputNameFor(prefixValue: string, name: string): string {
  return prefixValue.length > 0 ? `${prefixValue}.${name}` : name;
}

function collectRevealedNames(props: Record<string, PieceProperty>): string[] {
  return Object.values(props).flatMap((property) =>
    property.type === PropertyType.CHECKBOX ? property.reveals ?? [] : [],
  );
}

function isFilterActive(
  property: PieceProperty | undefined,
  value: unknown,
): boolean {
  if (isNilOrUndefined(value) || !property) {
    return false;
  }
  switch (property.type) {
    case PropertyType.CHECKBOX:
      return value === true;
    case PropertyType.NUMBER:
      return value !== property.defaultValue;
    case PropertyType.DATE_RANGE: {
      const preset = (value as { preset?: string })?.preset;
      return !!preset && preset !== 'any_time';
    }
    case PropertyType.ARRAY:
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      return Array.isArray(value) && value.length > 0;
    default:
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== property.defaultValue;
  }
}

function emptyValueFor(property: PieceProperty): unknown {
  switch (property.type) {
    case PropertyType.CHECKBOX:
      return false;
    case PropertyType.DATE_RANGE:
      return { preset: 'any_time' };
    case PropertyType.ARRAY:
    case PropertyType.MULTI_SELECT_DROPDOWN:
    case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
      return [];
    case PropertyType.NUMBER:
      return property.defaultValue ?? null;
    case PropertyType.STATIC_DROPDOWN:
    case PropertyType.DROPDOWN:
      return null;
    default:
      return '';
  }
}

function chipLabel(property: PieceProperty, value: unknown): string {
  const name = 'displayName' in property ? property.displayName : '';
  if (
    property.type === PropertyType.CHECKBOX ||
    property.type === PropertyType.DATE_RANGE ||
    property.type === PropertyType.STATIC_DROPDOWN ||
    property.type === PropertyType.DROPDOWN
  ) {
    return name;
  }
  if (typeof value === 'number') {
    return `${name}: ${value}`;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const trimmed = value.trim();
    const preview = trimmed.length > 24 ? `${trimmed.slice(0, 24)}…` : trimmed;
    return `${name}: ${preview}`;
  }
  return name;
}

function isNilOrUndefined(value: unknown): boolean {
  return value === null || value === undefined;
}

export const filterPropertyUtils = {
  inputNameFor,
  collectRevealedNames,
  isFilterActive,
  emptyValueFor,
  chipLabel,
  isNilOrUndefined,
};
