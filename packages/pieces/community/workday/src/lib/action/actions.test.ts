import {
	HttpMethod,
	HttpRequest,
	HttpResponse,
	httpClient,
} from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { callOperation } from './call-operation';
import { createUpdateCustomObject } from './create-update-custom-object';
import { getBusinessObjectDetailsBatch } from './get-business-object-details-batch';
import { getCustomObjects } from './get-custom-objects';
import { getReport } from './get-report';
import { getReportWqlBatch } from './get-report-wql-batch';
import { listCustomObjectDefinitionsBatch } from './list-custom-object-definitions-batch';
import { searchBusinessObjectBatch } from './search-business-object-batch';
import { updateBusinessObject } from './update-business-object';

const AUTH = {
	access_token: 'tok',
	props: { apiHost: 'wd2-impl-services1.workday.com', tenant: 'mytenant' },
};

const AUTH_WITH_ISU = {
	access_token: 'tok',
	props: {
		apiHost: 'wd2-impl-services1.workday.com',
		tenant: 'mytenant',
		isuUsername: 'isu@mytenant',
		isuPassword: 'secret',
	},
};

function resp(body: unknown): HttpResponse {
	return { status: 200, headers: {}, body };
}

function context(propsValue: Record<string, unknown>, auth: unknown = AUTH) {
	return { auth, propsValue } as never;
}

let sendRequest: ReturnType<typeof vi.spyOn>;

function requests(): HttpRequest[] {
	return sendRequest.mock.calls.map((c) => c[0] as HttpRequest);
}

beforeEach(() => {
	sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('get_business_object_details_batch', () => {
	it('fetches each id and returns standardized records', async () => {
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const id = request.url.split('/').pop();
			return resp({ id, title: `Req ${id}`, applicationStatus: 'Open' });
		});

		const out = (await getBusinessObjectDetailsBatch.run(
			context({
				module: 'recruiting',
				businessObject: { objectType: 'jobRequisitions' },
				objectIds: [{ id: '1' }, { id: '2' }],
			}),
		)) as { total_count: number; records: Record<string, unknown>[] };

		expect(out.total_count).toBe(2);
		expect(out.records[0]).toMatchObject({ job_requisition_id: '1', title: 'Req 1' });
		expect(requests()[0].url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/staffing/v6/mytenant/jobRequisitions/1',
		);
	});
});

describe('search_business_object_batch', () => {
	it('paginates and returns standardized records', async () => {
		sendRequest.mockResolvedValue(
			resp({ data: [{ id: 'w-1', descriptor: 'Jane', hireDate: '2025-01-01' }], total: 1 }),
		);

		const out = (await searchBusinessObjectBatch.run(
			context({
				module: 'onboarding',
				businessObject: { objectType: 'workers' },
				queryParams: { status: 'Active' },
			}),
		)) as { total_count: number; records: Record<string, unknown>[] };

		expect(out.total_count).toBe(1);
		expect(out.records[0]).toMatchObject({ employee_id: 'w-1', name: 'Jane' });
	});
});

describe('update_business_object', () => {
	it('PUTs to the record path and standardizes the response', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'w-1', status: 'Inactive' }));

		await updateBusinessObject.run(
			context({
				module: 'onboarding',
				businessObject: { objectType: 'workers' },
				objectId: 'w-1',
				body: { status: 'Inactive' },
			}),
		);

		const req = requests()[0];
		expect(req.method).toBe(HttpMethod.PUT);
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/staffing/v6/mytenant/workers/w-1',
		);
		expect(req.body).toEqual({ status: 'Inactive' });
	});
});

describe('call_operation', () => {
	it('calls a REST sub-resource with the chosen method', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'req-1', status: 'Closed' }));

		await callOperation.run(
			context({
				module: 'recruiting',
				businessObject: { objectType: 'jobRequisitions' },
				operationType: 'rest',
				operationName: '1/close',
				httpMethod: 'POST',
			}),
		);

		const req = requests()[0];
		expect(req.method).toBe(HttpMethod.POST);
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/staffing/v6/mytenant/jobRequisitions/1/close',
		);
	});

	it('calls a SOAP operation when operationType is soap', async () => {
		sendRequest.mockResolvedValue(
			resp(
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><Result>ok</Result></soapenv:Body></soapenv:Envelope>',
			),
		);

		await callOperation.run(
			context(
				{
					module: 'recruiting',
					businessObject: { objectType: 'jobRequisitions' },
					operationType: 'soap',
					operationName: 'Submit_Job_Requisition',
					soapService: 'Staffing',
				},
				AUTH_WITH_ISU,
			),
		);

		const req = requests()[0];
		expect(req.url).toContain('/ccx/service/mytenant/Staffing/');
		expect(String(req.body)).toContain('soapenv:Envelope');
	});
});

describe('get_custom_objects', () => {
	it('GETs a custom object instance and flattens it', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1', data: { name: 'X' } }));

		const out = (await getCustomObjects.run(
			context({ definitionId: 'def-1', objectId: 'obj-1' }),
		)) as Record<string, unknown>;

		expect(out['data_name']).toBe('X');
		expect(requests()[0].url).toContain('/customObjects/v1/mytenant/customObjects/def-1');
	});
});

describe('get_report', () => {
	it('returns flattened report rows from Report_Entry', async () => {
		sendRequest.mockResolvedValue(
			resp({ Report_Entry: [{ employee_id: 'w-1' }, { employee_id: 'w-2' }] }),
		);

		const out = (await getReport.run(
			context({ reportId: 'Worker_Report', reportParameters: undefined }),
		)) as { total_count: number; report_id: string };

		expect(out.total_count).toBe(2);
		expect(out.report_id).toBe('Worker_Report');
	});
});

describe('get_report_wql_batch', () => {
	it('runs a WQL query and returns all rows', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] }));

		const out = (await getReportWqlBatch.run(
			context({ query: 'SELECT id FROM workers' }),
		)) as { total_count: number };

		expect(out.total_count).toBe(3);
	});
});

describe('list_custom_object_definitions_batch', () => {
	it('lists definitions with a count', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 'def-1' }, { id: 'def-2' }] }));

		const out = (await listCustomObjectDefinitionsBatch.run(context({}))) as {
			total_count: number;
		};

		expect(out.total_count).toBe(2);
	});
});

describe('create_update_custom_object', () => {
	it('creates a custom object (no id) with PUT', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1' }));

		await createUpdateCustomObject.run(
			context({ definitionId: 'def-1', objectId: undefined, body: { name: 'X' } }),
		);

		const req = requests()[0];
		expect(req.method).toBe(HttpMethod.PUT);
		expect(req.body).toEqual({ name: 'X' });
	});

	it('injects the id into the body when updating', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1' }));

		await createUpdateCustomObject.run(
			context({ definitionId: 'def-1', objectId: 'obj-1', body: { name: 'X' } }),
		);

		expect(requests()[0].body).toEqual({ name: 'X', id: 'obj-1' });
	});
});
