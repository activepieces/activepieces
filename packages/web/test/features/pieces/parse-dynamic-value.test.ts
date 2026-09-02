import { Property } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';

import { formUtils } from '@/features/pieces/utils/form-utils';

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
const staticDropdown = Property.StaticDropdown({
  displayName: 'Channel',
  required: true,
  options: { options: [{ label: 'General', value: 'C0123' }] },
});

describe('formUtils.parseDynamicValue', () => {
  it.each([
    ['["year","day"]', multiSelect, ['year', 'day']],
    ['[]', multiSelect, []],
    ['true', checkbox, true],
    ['false', checkbox, false],
  ])('restores %s', (value, property, expected) => {
    expect(formUtils.parseDynamicValue({ property, value })).toEqual(expected);
  });

  it.each([
    ["{{ variables['channel'] }}", staticDropdown],
    ['{{ trigger.body.channel || "C0123" }}', staticDropdown],
    ['{{ trigger.body.units }}', multiSelect],
    ['{{ trigger.body.enabled }}', checkbox],
  ])('preserves the expression %s across the toggle', (value, property) => {
    expect(formUtils.parseDynamicValue({ property, value })).toEqual(value);
  });

  it('restores a stringified array whose item holds an expression', () => {
    expect(
      formUtils.parseDynamicValue({
        property: multiSelect,
        value: '["{{ trigger.body.unit }}","year"]',
      }),
    ).toEqual(['{{ trigger.body.unit }}', 'year']);
  });

  it.each([
    ['C0123', staticDropdown, 'C0123'],
    ['5', staticDropdown, '5'],
    [5, staticDropdown, 5],
    ['true', staticDropdown, 'true'],
    ['null', staticDropdown, 'null'],
    ['price {{high', staticDropdown, 'price {{high'],
    ['{"tier":"pro"}', staticDropdown, { tier: 'pro' }],
    ['["a","b"]', staticDropdown, ['a', 'b']],
  ])('keeps the dropdown literal %s as %s', (value, property, expected) => {
    expect(formUtils.parseDynamicValue({ property, value })).toEqual(expected);
  });

  it.each([
    ['year', multiSelect],
    ['{"not":"an array"}', multiSelect],
    ['price {{high', multiSelect],
    ['1', checkbox],
    ['["year","day"]', shortText],
    ['', staticDropdown],
    [undefined, staticDropdown],
  ])('has nothing unambiguous to restore in %s', (value, property) => {
    expect(formUtils.parseDynamicValue({ property, value })).toBeUndefined();
  });
});
