import { Property } from '@activepieces/pieces-framework';
import { ghostCommon } from './client';

type ClearableField = { label: string; value: string };

export const clearFieldsProp = (fields: ClearableField[]) =>
  Property.StaticMultiSelectDropdown({
    displayName: 'Clear Fields',
    description:
      'Fields to blank out on the record. A field listed here must not also be given a new value. Leave empty to clear nothing.',
    required: false,
    options: { options: fields },
  });

export const applyClearFields = ({
  body,
  clear,
  allowed,
  clearValue,
}: {
  body: Record<string, unknown>;
  clear: unknown;
  allowed: string[];
  clearValue: null | '';
}): Record<string, unknown> => {
  const fields = ghostCommon.stringList(clear) ?? [];
  for (const field of fields) {
    if (!allowed.includes(field)) {
      throw new Error(`"${field}" cannot be cleared. Clearable fields: ${allowed.join(', ')}.`);
    }
    if (body[field] !== undefined) {
      throw new Error(`"${field}" is both set to a new value and listed in Clear Fields. Choose one.`);
    }
    body[field] = clearValue;
  }
  return body;
};
