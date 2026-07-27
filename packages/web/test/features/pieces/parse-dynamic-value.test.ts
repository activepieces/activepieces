import { piecePropertiesUtils, Property } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';

const multiSelect = Property.StaticMultiSelectDropdown({
  displayName: 'Unit to Extract',
  required: true,
  defaultValue: ['year'],
  options: { options: [{ label: 'Year', value: 'year' }] },
});
const checkbox = Property.Checkbox({
  displayName: 'Checkbox',
  required: false,
});
const shortText = Property.ShortText({ displayName: 'Text', required: false });

describe('piecePropertiesUtils.parseDynamicValue', () => {
  it.each([
    [multiSelect, '["year","day"]', ['year', 'day']],
    [multiSelect, '[]', []],
    [checkbox, 'true', true],
    [checkbox, 'false', false],
  ])('restores case %#', (property, value, expected) => {
    expect(piecePropertiesUtils.parseDynamicValue({ property, value })).toEqual(
      expected,
    );
  });

  it.each([
    [multiSelect, '{{ trigger.body.units }}'],
    [multiSelect, ''],
    [multiSelect, 'year'],
    [multiSelect, '{"not":"an array"}'],
    [checkbox, '1'],
    [shortText, '["year","day"]'],
  ])('has nothing unambiguous to restore in case %#', (property, value) => {
    expect(
      piecePropertiesUtils.parseDynamicValue({ property, value }),
    ).toBeUndefined();
  });
});
