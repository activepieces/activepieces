import { describe, it, expect } from 'vitest';

import { hintUtils } from '@/components/custom/smart-output-viewer/resolve-hints';
import type {
  HintField,
  OutputDisplayHints,
} from '@/components/custom/smart-output-viewer/types';

describe('hintUtils.titleCase', () => {
  it('humanises camelCase keys', () => {
    expect(hintUtils.titleCase('firstName')).toBe('First Name');
  });

  it('humanises snake_case keys', () => {
    expect(hintUtils.titleCase('first_name')).toBe('First Name');
  });

  it('humanises kebab-case keys', () => {
    expect(hintUtils.titleCase('first-name')).toBe('First Name');
  });

  it('returns single-word keys capitalised', () => {
    expect(hintUtils.titleCase('id')).toBe('Id');
  });
});

describe('hintUtils.resolveFieldLabel', () => {
  it('uses the explicit label when present', () => {
    const field: HintField = { key: 'firstName', label: 'Given Name' };
    expect(hintUtils.resolveFieldLabel(field)).toBe('Given Name');
  });

  it('falls back to title-cased key when no label is given', () => {
    const field: HintField = { key: 'firstName' };
    expect(hintUtils.resolveFieldLabel(field)).toBe('First Name');
  });
});

describe('hintUtils.resolveFieldPath', () => {
  it('uses the explicit value path when present', () => {
    const field: HintField = { key: 'id', value: 'data.uuid' };
    expect(hintUtils.resolveFieldPath(field)).toBe('data.uuid');
  });

  it('uses the key when no value path is given', () => {
    const field: HintField = { key: 'id' };
    expect(hintUtils.resolveFieldPath(field)).toBe('id');
  });

  it('joins parent path and key when no explicit value is given', () => {
    const field: HintField = { key: 'name' };
    expect(hintUtils.resolveFieldPath(field, 'user')).toBe('user.name');
  });

  it('ignores parent path when an explicit value path is provided', () => {
    const field: HintField = { key: 'name', value: 'absolute.path' };
    expect(hintUtils.resolveFieldPath(field, 'user')).toBe('absolute.path');
  });
});

describe('hintUtils.resolveItemFieldPath', () => {
  it('uses value when present', () => {
    const field: HintField = { key: 'id', value: 'uuid' };
    expect(hintUtils.resolveItemFieldPath(field)).toBe('uuid');
  });

  it('falls back to key', () => {
    const field: HintField = { key: 'id' };
    expect(hintUtils.resolveItemFieldPath(field)).toBe('id');
  });
});

describe('hintUtils.visibleFields', () => {
  it('returns hero and secondary arrays', () => {
    const hints: OutputDisplayHints = {
      hero: [{ key: 'a' }],
      secondary: [{ key: 'b' }],
    };
    expect(hintUtils.visibleFields(hints)).toEqual({
      hero: [{ key: 'a' }],
      secondary: [{ key: 'b' }],
    });
  });

  it('defaults secondary to an empty array when missing', () => {
    const hints: OutputDisplayHints = { hero: [{ key: 'a' }] };
    expect(hintUtils.visibleFields(hints).secondary).toEqual([]);
  });
});
