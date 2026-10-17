import { describe, expect, it } from 'vitest';

import { workdayUtils } from '../src/lib/common/utils';

describe('flattenRecord', () => {
	it('flattens nested objects with underscore-joined keys', () => {
		expect(
			workdayUtils.flattenRecord({
				value: { worker: { id: 1, descriptor: 'Jane' } },
			}),
		).toEqual({
			worker_id: 1,
			worker_descriptor: 'Jane',
		});
	});

	it('JSON-stringifies nested arrays under their key', () => {
		expect(workdayUtils.flattenRecord({ value: { lines: [{ id: 1 }] } })).toEqual({
			lines: JSON.stringify([{ id: 1 }]),
		});
	});

	it('puts a top-level array under "items"', () => {
		expect(workdayUtils.flattenRecord({ value: [1, 2] })).toEqual({
			items: JSON.stringify([1, 2]),
		});
	});

	it('preserves null leaf values', () => {
		expect(workdayUtils.flattenRecord({ value: { status: null } })).toEqual({
			status: null,
		});
	});
});

describe('formatOutput', () => {
	it('maps recruiting fields, resolving nested descriptors/ids', () => {
		const out = workdayUtils.formatOutput({
			record: {
				id: 'req-1',
				title: 'Engineer',
				location: { descriptor: 'San Francisco' },
				candidate: { id: 'cand-9' },
				applicationStatus: 'In Progress',
			},
			module: 'recruiting',
		});
		expect(out).toMatchObject({
			job_requisition_id: 'req-1',
			title: 'Engineer',
			location: 'San Francisco',
			candidate_id: 'cand-9',
			application_status: 'In Progress',
		});
	});

	it('maps onboarding fields with worker fallback', () => {
		const out = workdayUtils.formatOutput({
			record: {
				worker: { id: 'w-1', descriptor: 'Jane Doe' },
				hireDate: '2025-01-02',
				status: 'Active',
			},
			module: 'onboarding',
		});
		expect(out).toMatchObject({
			employee_id: 'w-1',
			name: 'Jane Doe',
			hire_date: '2025-01-02',
			status: 'Active',
		});
	});

	it('maps HR case fields without setting time_entry_id', () => {
		const out = workdayUtils.formatOutput({
			record: {
				id: 'case-1',
				worker: { id: 'w-2' },
				description: 'Payroll question',
				status: 'Open',
			},
			module: 'hr_services_time_tracking',
		});
		expect(out).toMatchObject({
			case_id: 'case-1',
			employee_id: 'w-2',
			description: 'Payroll question',
			status: 'Open',
		});
		expect(out['time_entry_id']).toBeUndefined();
	});

	it('maps HR time-entry fields without polluting case_id', () => {
		const out = workdayUtils.formatOutput({
			record: {
				id: 'te-1',
				worker: { id: 'w-2' },
				date: '2025-03-01',
				hours: 8,
				status: 'Submitted',
			},
			module: 'hr_services_time_tracking',
		});
		expect(out).toMatchObject({
			time_entry_id: 'te-1',
			employee_id: 'w-2',
			date: '2025-03-01',
			hours: 8,
		});
		expect(out['case_id']).toBeUndefined();
	});

	it('maps a timeTracking v7 worker time block', () => {
		const out = workdayUtils.formatOutput({
			record: {
				id: 'tb-1',
				worker: { id: 'w-3' },
				calendarDate: '2026-10-14',
				reportedQuantity: 4,
			},
			module: 'hr_services_time_tracking',
		});
		expect(out).toMatchObject({
			time_entry_id: 'tb-1',
			employee_id: 'w-3',
			date: '2026-10-14',
			hours: 4,
		});
	});
});

describe('getRecordTimestamp', () => {
	it('prefers the provided field', () => {
		expect(
			workdayUtils.getRecordTimestamp({
				record: { myDate: '2025-01-01', createdMoment: '2024-01-01' },
				preferredField: 'myDate',
			}),
		).toBe('2025-01-01');
	});

	it('falls back through the standard timestamp fields', () => {
		expect(
			workdayUtils.getRecordTimestamp({
				record: { updatedMoment: '2025-05-05' },
			}),
		).toBe('2025-05-05');
	});

	it('returns undefined when no timestamp is present', () => {
		expect(workdayUtils.getRecordTimestamp({ record: { foo: 'bar' } })).toBeUndefined();
	});
});

describe('resolveBusinessObject', () => {
	it('resolves a standard business object for a module', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'onboarding',
			selection: { objectType: 'workers' },
		});
		expect(config.path).toBe('/workers');
		expect(config.service).toBe('staffing/v6');
	});

	it('builds a custom object config from a path', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'recruiting',
			selection: {
				objectType: '__custom__',
				customPath: 'invoices',
				customService: 'v1',
			},
		});
		expect(config.path).toBe('/invoices');
		expect(config.service).toBe('v1');
	});

	it('maps the retired expenseManagement/v1 service to expense/v1', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'onboarding',
			selection: {
				objectType: '__custom__',
				customPath: '/reports',
				customService: 'expenseManagement/v1',
			},
		});
		expect(config.service).toBe('expense/v1');
	});

	it('maps the retired time/v2 service to timeTracking/v7', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'onboarding',
			selection: {
				objectType: '__custom__',
				customPath: '/workerTimeBlocks',
				customService: 'time/v2',
			},
		});
		expect(config.service).toBe('timeTracking/v7');
	});

	it('maps the retired resourceManagement/v3 service to procurement/v5', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'onboarding',
			selection: {
				objectType: '__custom__',
				customPath: '/purchaseOrders',
				customService: 'resourceManagement/v3',
			},
		});
		expect(config.service).toBe('procurement/v5');
	});

	it('resolves Case to the helpCase/v4 service', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'hr_services_time_tracking',
			selection: { objectType: 'cases' },
		});
		expect(config.path).toBe('/cases');
		expect(config.service).toBe('helpCase/v4');
	});

	it('resolves Time Entry to worker time blocks', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'hr_services_time_tracking',
			selection: { objectType: 'timeEntries' },
		});
		expect(config.path).toBe('/workerTimeBlocks');
		expect(config.service).toBe('timeTracking/v7');
	});

	it('prefixes a missing slash on custom paths', () => {
		const config = workdayUtils.resolveBusinessObject({
			module: 'onboarding',
			selection: { objectType: '__custom__', customPath: 'workers' },
		});
		expect(config.path).toBe('/workers');
	});

	it('throws when a custom path is missing', () => {
		expect(() =>
			workdayUtils.resolveBusinessObject({
				module: 'recruiting',
				selection: { objectType: '__custom__', customPath: '' },
			}),
		).toThrow('Custom Business Object Path is required');
	});

	it('throws for an unknown business object', () => {
		expect(() =>
			workdayUtils.resolveBusinessObject({
				module: 'recruiting',
				selection: { objectType: 'nope' },
			}),
		).toThrow();
	});
});

describe('toWorkdayModule', () => {
	it('accepts the three supported modules', () => {
		expect(workdayUtils.toWorkdayModule({ module: 'recruiting' })).toBe('recruiting');
		expect(workdayUtils.toWorkdayModule({ module: 'onboarding' })).toBe('onboarding');
		expect(workdayUtils.toWorkdayModule({ module: 'hr_services_time_tracking' })).toBe(
			'hr_services_time_tracking',
		);
	});

	it('throws for an invalid module', () => {
		expect(() => workdayUtils.toWorkdayModule({ module: 'finance' })).toThrow();
	});
});

describe('SOAP business objects', () => {
	const workers = workdayUtils.resolveSoapObject({ value: 'workers' });

	it('builds a Get request with references, change window, paging and response group', () => {
		const xml = workdayUtils.buildSoapGetRequest({
			object: workers,
			ids: ['3aa5550b7fe348b98d7b5741afc65534', '21<001'],
			updatedFrom: '2026-10-01T00:00:00.000Z',
			updatedThrough: '2026-10-02T00:00:00.000Z',
			page: 2,
			asOfEntryDateTime: '2026-10-02T00:00:00.000Z',
		});
		expect(xml).toContain('<bsvc:Get_Workers_Request xmlns:bsvc="urn:com.workday/bsvc">');
		expect(xml).toContain(
			'<bsvc:Worker_Reference><bsvc:ID bsvc:type="WID">3aa5550b7fe348b98d7b5741afc65534</bsvc:ID></bsvc:Worker_Reference>',
		);
		expect(xml).toContain('<bsvc:ID bsvc:type="Employee_ID">21&lt;001</bsvc:ID>');
		expect(xml).toContain('<bsvc:Updated_From>2026-10-01T00:00:00.000Z</bsvc:Updated_From>');
		expect(xml).toContain(
			'<bsvc:Response_Filter><bsvc:As_Of_Entry_DateTime>2026-10-02T00:00:00.000Z</bsvc:As_Of_Entry_DateTime><bsvc:Page>2</bsvc:Page><bsvc:Count>100</bsvc:Count></bsvc:Response_Filter>',
		);
		expect(xml).toContain('<bsvc:Include_Reference>true</bsvc:Include_Reference>');
		expect(xml.indexOf('Request_References')).toBeLessThan(xml.indexOf('Request_Criteria'));
		expect(xml.indexOf('Request_Criteria')).toBeLessThan(xml.indexOf('Response_Filter'));
		expect(xml.indexOf('Response_Filter')).toBeLessThan(xml.indexOf('Response_Group'));
	});

	it('puts payee references inside the request criteria', () => {
		const xml = workdayUtils.buildSoapGetRequest({
			object: workdayUtils.resolveSoapObject({ value: 'payees' }),
			ids: ['21001'],
		});
		expect(xml).not.toContain('Request_References');
		expect(xml).toContain(
			'<bsvc:Request_Criteria><bsvc:Payee_Reference><bsvc:ID bsvc:type="Employee_ID">21001</bsvc:ID></bsvc:Payee_Reference></bsvc:Request_Criteria>',
		);
	});

	it('reads records, paging info and simplifies references', () => {
		const page = workdayUtils.readSoapGetPage({
			object: workers,
			body: {
				Get_Workers_Response: {
					Response_Filter: { As_Of_Entry_DateTime: '2026-10-02T00:00:00.000Z' },
					Response_Results: { Total_Results: 101, Total_Pages: 2 },
					Response_Data: {
						Worker: {
							Worker_Reference: {
								ID: [
									{ '#text': 'abc', '@_type': 'WID' },
									{ '#text': 21001, '@_type': 'Employee_ID' },
								],
							},
							Worker_Descriptor: 'Logan McNeil',
							Worker_Data: {
								Location_Reference: {
									'@_Descriptor': 'San Francisco',
									ID: { '#text': 'loc', '@_type': 'WID' },
								},
							},
						},
					},
				},
			},
		});
		expect(page.totalPages).toBe(2);
		expect(page.asOfEntryDateTime).toBe('2026-10-02T00:00:00.000Z');
		expect(page.records).toEqual([
			{
				id: 'abc',
				Worker_Reference: { WID: 'abc', Employee_ID: '21001' },
				Worker_Descriptor: 'Logan McNeil',
				Worker_Data: { Location_Reference: { WID: 'loc', descriptor: 'San Francisco' } },
			},
		]);
	});

	it('lists only change-tracked objects for triggers', () => {
		const tracked = workdayUtils
			.soapObjects({ transactionLogOnly: true })
			.map((item) => item.value);
		expect(tracked).toEqual([
			'workers',
			'job_profiles',
			'positions',
			'job_requisitions',
			'evergreen_requisitions',
		]);
		expect(() => workdayUtils.resolveSoapObject({ value: 'nope' })).toThrow();
	});
});
