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
    ['{{ trigger.body.units }}', multiSelect],
    ['year', multiSelect],
    ['{"not":"an array"}', multiSelect],
    ['1', checkbox],
    ['["year","day"]', shortText],
  ])('has nothing unambiguous to restore in %s', (value, property) => {
    expect(formUtils.parseDynamicValue({ property, value })).toBeUndefined();
  });
});
