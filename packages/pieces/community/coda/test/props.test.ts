import { describe, expect, test } from 'vitest';
import { columnToProperty } from '../src/lib/common/props';
import { CodaTableColumn } from '../src/lib/common/types';

function column({ type, extra = {} }: { type: string; extra?: Partial<CodaTableColumn> }): CodaTableColumn {
	return { id: 'c-1', type: 'column', href: '', name: 'Col', format: { type }, ...extra };
}

describe('columnToProperty', () => {
	test('dateTime columns get a date-time field', () => {
		expect(columnToProperty(column({ type: 'dateTime' }))?.type).toBe('DATE_TIME');
	});
	test.each([
		['text', 'SHORT_TEXT'],
		['email', 'SHORT_TEXT'],
		['select', 'SHORT_TEXT'],
		['number', 'NUMBER'],
		['currency', 'NUMBER'],
		['date', 'DATE_TIME'],
		['time', 'DATE_TIME'],
		['checkbox', 'CHECKBOX'],
	])('%s → %s', (type, expected) => {
		expect(columnToProperty(column({ type }))?.type).toBe(expected);
	});
	test('calculated and unsupported columns are skipped', () => {
		expect(columnToProperty(column({ type: 'text', extra: { calculated: true } }))).toBeUndefined();
		expect(columnToProperty(column({ type: 'button' }))).toBeUndefined();
		expect(columnToProperty(column({ type: 'person' }))).toBeUndefined();
	});
	test('multi-select columns explain comma-separated input', () => {
		expect(columnToProperty(column({ type: 'select', extra: { format: { type: 'select', isArray: true } } }))?.description).toBe(
			'Provide options as comma-separated values.',
		);
	});
});
