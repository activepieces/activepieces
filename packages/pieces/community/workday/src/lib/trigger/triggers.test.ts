import { HttpResponse, httpClient } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { employeeTerminated } from './employee-terminated';
import { newHireCreated } from './new-hire-created';
import { newOrUpdatedBusinessObject } from './new-or-updated-business-object';
import { newOrUpdatedBusinessObjectBatch } from './new-or-updated-business-object-batch';
import { scheduledReportFetchBatch } from './scheduled-report-fetch-batch';
import { scheduledReportFetchWqlBatch } from './scheduled-report-fetch-wql-batch';

const AUTH = {
	access_token: 'tok',
	props: { apiHost: 'wd2-impl-services1.workday.com', tenant: 'mytenant' },
};

function resp(body: unknown): HttpResponse {
	return { status: 200, headers: {}, body };
}

function makeStore(initial: Record<string, unknown> = {}) {
	const data: Record<string, unknown> = { ...initial };
	return {
		get: async (key: string) => (key in data ? data[key] : undefined),
		put: async (key: string, value: unknown) => {
			data[key] = value;
			return value;
		},
		delete: async (key: string) => {
			delete data[key];
		},
	};
}

function triggerContext(
	propsValue: Record<string, unknown>,
	store: ReturnType<typeof makeStore>,
) {
	return { auth: AUTH, store, propsValue, files: {} } as never;
}

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('new_or_updated_business_object', () => {
	it('test() returns standardized records', async () => {
		sendRequest.mockResolvedValue(
			resp({
				data: [
					{
						id: 'r1',
						title: 'Engineer',
						applicationStatus: 'Open',
						lastFunctionallyUpdated: '2025-06-01T00:00:00Z',
					},
				],
			}),
		);

		const items = (await newOrUpdatedBusinessObject.test(
			triggerContext(
				{
					module: 'recruiting',
					businessObject: { objectType: 'jobRequisitions' },
					dateField: 'lastFunctionallyUpdated',
					additionalFilters: undefined,
				},
				makeStore(),
			),
		)) as Record<string, unknown>[];

		expect(items).toHaveLength(1);
		expect(items[0]).toMatchObject({ job_requisition_id: 'r1', application_status: 'Open' });
	});

	it('run() returns only records newer than the last poll', async () => {
		const lastPoll = Date.parse('2025-01-01T00:00:00Z');
		sendRequest.mockResolvedValue(
			resp({
				data: [
					{ id: 'new', title: 'New', lastFunctionallyUpdated: '2025-06-01T00:00:00Z' },
					{ id: 'old', title: 'Old', lastFunctionallyUpdated: '2024-06-01T00:00:00Z' },
				],
			}),
		);

		const items = (await newOrUpdatedBusinessObject.run(
			triggerContext(
				{
					module: 'recruiting',
					businessObject: { objectType: 'jobRequisitions' },
					dateField: 'lastFunctionallyUpdated',
					additionalFilters: undefined,
				},
				makeStore({ lastPoll }),
			),
		)) as Record<string, unknown>[];

		expect(items).toHaveLength(1);
		expect(items[0]['job_requisition_id']).toBe('new');
	});
});

describe('new_or_updated_business_object_batch', () => {
	it('test() returns a single batch item with all records', async () => {
		sendRequest.mockResolvedValue(
			resp({
				data: [
					{ id: 'r1', title: 'A', lastFunctionallyUpdated: '2025-06-01T00:00:00Z' },
					{ id: 'r2', title: 'B', lastFunctionallyUpdated: '2025-06-02T00:00:00Z' },
				],
			}),
		);

		const items = (await newOrUpdatedBusinessObjectBatch.test(
			triggerContext(
				{
					module: 'recruiting',
					businessObject: { objectType: 'jobRequisitions' },
					dateField: 'lastFunctionallyUpdated',
					additionalFilters: undefined,
				},
				makeStore(),
			),
		)) as Array<{ total_count: number; records: Record<string, unknown>[] }>;

		expect(items).toHaveLength(1);
		expect(items[0].total_count).toBe(2);
	});
});

describe('scheduled_report_fetch_batch', () => {
	it('test() returns the report rows as one batch', async () => {
		sendRequest.mockResolvedValue(
			resp({ Report_Entry: [{ employee_id: 'w-1' }, { employee_id: 'w-2' }] }),
		);

		const items = (await scheduledReportFetchBatch.test(
			triggerContext({ reportId: 'lmcneil/PT_Workers', reportParameters: undefined }, makeStore()),
		)) as Array<{ total_count: number; report_id: string }>;

		expect(items).toHaveLength(1);
		expect(items[0].total_count).toBe(2);
		expect(items[0].report_id).toBe('lmcneil/PT_Workers');
	});
});

describe('scheduled_report_fetch_wql_batch', () => {
	it('test() returns WQL rows as one batch', async () => {
		sendRequest.mockResolvedValue(
			resp({ data: [{ employee_id: 'w-1', lastFunctionallyUpdated: '2025-06-01T00:00:00Z' }] }),
		);

		const items = (await scheduledReportFetchWqlBatch.test(
			triggerContext(
				{ query: 'SELECT employee_id FROM workers', dateField: 'lastFunctionallyUpdated' },
				makeStore(),
			),
		)) as Array<{ total_count: number }>;

		expect(items).toHaveLength(1);
		expect(items[0].total_count).toBe(1);
	});
});

describe('new_hire_created', () => {
	it('polls allWorkers by createdMoment and keeps the id/descriptor keys', async () => {
		sendRequest.mockResolvedValue(
			resp({
				data: [{ worker: { id: 'w-9', descriptor: 'Pat Doe' }, hireDate: '2027-11-30', createdMoment: '2026-10-14T08:00:00.000Z' }],
			}),
		);
		const events = await newHireCreated.test(triggerContext({}, makeStore()));
		const query = (sendRequest.mock.calls[0][0] as { body: { query: string } }).body.query;
		expect(query).toContain("FROM allWorkers WHERE createdMoment > '1970-01-01T00:00:00.000Z'");
		expect(events[0]).toMatchObject({ id: 'w-9', descriptor: 'Pat Doe', hireDate: '2027-11-30' });
	});
});

describe('employee_terminated', () => {
	it('polls completed terminations and maps the effective date to terminationDate', async () => {
		sendRequest.mockResolvedValue(
			resp({
				data: [{ worker: { id: 'w-3', descriptor: 'Sam Roe' }, effectiveDate: '2026-10-31', dateAndTimeCompleted: '2026-10-14T09:00:00.000Z' }],
			}),
		);
		const events = await employeeTerminated.test(triggerContext({}, makeStore()));
		const query = (sendRequest.mock.calls[0][0] as { body: { query: string } }).body.query;
		expect(query).toContain('FROM terminations WHERE dateAndTimeCompleted >');
		expect(events[0]).toMatchObject({ id: 'w-3', descriptor: 'Sam Roe', terminationDate: '2026-10-31' });
	});
});
