import { describe, expect, it } from 'vitest';
import {
	flattenRecord,
	formatWorkdayOutput,
	getRecordTimestamp,
} from './fields';

describe('flattenRecord', () => {
	it('flattens nested objects with underscore-joined keys', () => {
		expect(flattenRecord({ worker: { id: 1, descriptor: 'Jane' } })).toEqual({
			worker_id: 1,
			worker_descriptor: 'Jane',
		});
	});

	it('JSON-stringifies nested arrays under their key', () => {
		expect(flattenRecord({ lines: [{ id: 1 }] })).toEqual({
			lines: JSON.stringify([{ id: 1 }]),
		});
	});

	it('puts a top-level array under "items"', () => {
		expect(flattenRecord([1, 2])).toEqual({ items: JSON.stringify([1, 2]) });
	});

	it('preserves null leaf values', () => {
		expect(flattenRecord({ status: null })).toEqual({ status: null });
	});
});

describe('formatWorkdayOutput', () => {
	it('maps recruiting fields, resolving nested descriptors/ids', () => {
		const out = formatWorkdayOutput(
			{
				id: 'req-1',
				title: 'Engineer',
				location: { descriptor: 'San Francisco' },
				candidate: { id: 'cand-9' },
				applicationStatus: 'In Progress',
			},
			'recruiting',
		);
		expect(out).toMatchObject({
			job_requisition_id: 'req-1',
			title: 'Engineer',
			location: 'San Francisco',
			candidate_id: 'cand-9',
			application_status: 'In Progress',
		});
	});

	it('maps onboarding fields with worker fallback', () => {
		const out = formatWorkdayOutput(
			{ worker: { id: 'w-1', descriptor: 'Jane Doe' }, hireDate: '2025-01-02', status: 'Active' },
			'onboarding',
		);
		expect(out).toMatchObject({
			employee_id: 'w-1',
			name: 'Jane Doe',
			hire_date: '2025-01-02',
			status: 'Active',
		});
	});

	it('maps HR case fields without setting time_entry_id', () => {
		const out = formatWorkdayOutput(
			{ id: 'case-1', worker: { id: 'w-2' }, description: 'Payroll question', status: 'Open' },
			'hr_services_time_tracking',
		);
		expect(out).toMatchObject({
			case_id: 'case-1',
			employee_id: 'w-2',
			description: 'Payroll question',
			status: 'Open',
		});
		expect(out['time_entry_id']).toBeUndefined();
	});

	it('maps HR time-entry fields without polluting case_id', () => {
		const out = formatWorkdayOutput(
			{ id: 'te-1', worker: { id: 'w-2' }, date: '2025-03-01', hours: 8, status: 'Submitted' },
			'hr_services_time_tracking',
		);
		expect(out).toMatchObject({
			time_entry_id: 'te-1',
			employee_id: 'w-2',
			date: '2025-03-01',
			hours: 8,
		});
		expect(out['case_id']).toBeUndefined();
	});
});

describe('getRecordTimestamp', () => {
	it('prefers the provided field', () => {
		expect(
			getRecordTimestamp({ myDate: '2025-01-01', createdMoment: '2024-01-01' }, 'myDate'),
		).toBe('2025-01-01');
	});

	it('falls back through the standard timestamp fields', () => {
		expect(getRecordTimestamp({ updatedMoment: '2025-05-05' })).toBe('2025-05-05');
	});

	it('returns undefined when no timestamp is present', () => {
		expect(getRecordTimestamp({ foo: 'bar' })).toBeUndefined();
	});
});
