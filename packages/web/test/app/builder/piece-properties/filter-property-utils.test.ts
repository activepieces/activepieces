import { Property } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';

import { filterPropertyUtils } from '@/app/builder/piece-properties/filter-property-utils';

const { isFilterActive, emptyValueFor } = filterPropertyUtils;

const shortText = Property.ShortText({ displayName: 'Text', required: false });
const checkbox = Property.Checkbox({
  displayName: 'Flag',
  required: false,
  defaultValue: false,
});
const number = Property.Number({
  displayName: 'Count',
  required: false,
  defaultValue: 10,
});
const dateRange = Property.DateRange({ displayName: 'Date', required: false });
const dropdown = Property.StaticDropdown({
  displayName: 'Pick',
  required: false,
  options: { options: [] },
});

describe('filterPropertyUtils.isFilterActive', () => {
  it('treats empty / whitespace text as inactive and non-empty text as active', () => {
    expect(isFilterActive(shortText, '')).toBe(false);
    expect(isFilterActive(shortText, '   ')).toBe(false);
    expect(isFilterActive(shortText, undefined)).toBe(false);
    expect(isFilterActive(shortText, 'hello')).toBe(true);
  });

  it('treats a checkbox as active only when true', () => {
    expect(isFilterActive(checkbox, false)).toBe(false);
    expect(isFilterActive(checkbox, true)).toBe(true);
  });

  it('treats a number as active only when it differs from its default', () => {
    expect(isFilterActive(number, 10)).toBe(false);
    expect(isFilterActive(number, 11)).toBe(true);
  });

  it('treats a date range as active only for a real preset', () => {
    expect(isFilterActive(dateRange, { preset: 'any_time' })).toBe(false);
    expect(isFilterActive(dateRange, {})).toBe(false);
    expect(isFilterActive(dateRange, { preset: 'last_7_days' })).toBe(true);
  });

  it('treats a null dropdown as inactive and a selected value as active', () => {
    expect(isFilterActive(dropdown, null)).toBe(false);
    expect(isFilterActive(dropdown, 'primary')).toBe(true);
  });
});

describe('filterPropertyUtils.emptyValueFor', () => {
  it('returns the inactive default for each type', () => {
    expect(emptyValueFor(shortText)).toBe('');
    expect(emptyValueFor(checkbox)).toBe(false);
    expect(emptyValueFor(number)).toBe(10);
    expect(emptyValueFor(dropdown)).toBeNull();
    expect(emptyValueFor(dateRange)).toEqual({ preset: 'any_time' });
  });

  it('produces a value that isFilterActive reports as inactive', () => {
    for (const property of [shortText, checkbox, number, dropdown, dateRange]) {
      expect(isFilterActive(property, emptyValueFor(property))).toBe(false);
    }
  });
});
