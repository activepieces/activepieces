/// <reference types="vitest/globals" />

import { inputUtils } from '../src/lib/common/inputs';

describe('asRecords', () => {
	test('keeps only object entries of an array', () => {
		expect(inputUtils.asRecords([{ id: 'a' }, 'x', null, 3, [{ id: 'nested' }], { id: 'b' }])).toEqual([{ id: 'a' }, { id: 'b' }]);
	});

	test('accepts a JSON-encoded array string, as the builder sends when a prop is toggled to dynamic', () => {
		expect(inputUtils.asRecords('[{"id":"a","title":"A"}]')).toEqual([{ id: 'a', title: 'A' }]);
		expect(inputUtils.asRecords('  [{"id":"a"}]  ')).toEqual([{ id: 'a' }]);
	});

	test('returns an empty list for anything that is not an array', () => {
		expect(inputUtils.asRecords(undefined)).toEqual([]);
		expect(inputUtils.asRecords(null)).toEqual([]);
		expect(inputUtils.asRecords({ id: 'a' })).toEqual([]);
		expect(inputUtils.asRecords('not json')).toEqual([]);
		expect(inputUtils.asRecords('[broken')).toEqual([]);
		expect(inputUtils.asRecords('{"id":"a"}')).toEqual([]);
	});
});

describe('asStrings', () => {
	test('keeps non-empty strings only, from arrays or JSON strings', () => {
		expect(inputUtils.asStrings(['a', '', 1, null, 'b'])).toEqual(['a', 'b']);
		expect(inputUtils.asStrings('["x","y"]')).toEqual(['x', 'y']);
		expect(inputUtils.asStrings('plain')).toEqual([]);
		expect(inputUtils.asStrings(undefined)).toEqual([]);
	});
});

describe('requiredString / optionalString', () => {
	test('reads a string field and treats empty or non-string values as missing', () => {
		expect(inputUtils.optionalString({ record: { a: 'x' }, key: 'a' })).toBe('x');
		expect(inputUtils.optionalString({ record: { a: '' }, key: 'a' })).toBeUndefined();
		expect(inputUtils.optionalString({ record: { a: 5 }, key: 'a' })).toBeUndefined();
		expect(inputUtils.optionalString({ record: {}, key: 'a' })).toBeUndefined();
	});

	test('requiredString names the field in its error', () => {
		expect(() => inputUtils.requiredString({ record: {}, key: 'id', label: 'Button ID' })).toThrow('Button ID is required on every entry.');
		expect(inputUtils.requiredString({ record: { id: 'ok' }, key: 'id', label: 'Button ID' })).toBe('ok');
	});

	test('maxLength is enforced with the actual length in the message and is inclusive', () => {
		expect(inputUtils.requiredString({ record: { t: 'x'.repeat(20) }, key: 't', label: 'Title', maxLength: 20 })).toHaveLength(20);
		expect(() => inputUtils.requiredString({ record: { t: 'x'.repeat(21) }, key: 't', label: 'Title', maxLength: 20 })).toThrow(
			'Title must be at most 20 characters (got 21).',
		);
		expect(() => inputUtils.optionalString({ record: { d: 'y'.repeat(73) }, key: 'd', label: 'Description', maxLength: 72 })).toThrow(
			'Description must be at most 72 characters (got 73).',
		);
		expect(inputUtils.optionalString({ record: {}, key: 'd', label: 'Description', maxLength: 72 })).toBeUndefined();
	});
});

describe('assertMaxLength / assertUnique', () => {
	test('assertMaxLength ignores undefined and empty values', () => {
		expect(() => inputUtils.assertMaxLength({ value: undefined, maxLength: 1, label: 'X' })).not.toThrow();
		expect(() => inputUtils.assertMaxLength({ value: '', maxLength: 1, label: 'X' })).not.toThrow();
		expect(() => inputUtils.assertMaxLength({ value: 'ab', maxLength: 1, label: 'X' })).toThrow('X must be at most 1 characters (got 2).');
	});

	test('assertUnique rejects duplicates and accepts distinct or empty lists', () => {
		expect(() => inputUtils.assertUnique({ values: ['Yes', 'No', 'Yes'], label: 'Button titles' })).toThrow('Button titles must be unique.');
		expect(() => inputUtils.assertUnique({ values: ['Yes', 'No'], label: 'Button titles' })).not.toThrow();
		expect(() => inputUtils.assertUnique({ values: [], label: 'Button titles' })).not.toThrow();
	});
});

describe('isRecord', () => {
	test('distinguishes plain objects from arrays, null and primitives', () => {
		expect(inputUtils.isRecord({})).toBe(true);
		expect(inputUtils.isRecord([])).toBe(false);
		expect(inputUtils.isRecord(null)).toBe(false);
		expect(inputUtils.isRecord('s')).toBe(false);
	});
});
