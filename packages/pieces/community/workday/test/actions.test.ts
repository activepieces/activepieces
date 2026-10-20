import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';

import { callOperationAction } from '../src/lib/actions/call-operation';
import { createTimeOffRequestAction } from '../src/lib/actions/create-time-off-request';
import { createUpdateCustomObjectAction } from '../src/lib/actions/create-update-custom-object';
import { findSupplierInvoiceAction } from '../src/lib/actions/find-supplier-invoice';
import { getBusinessObjectDetailsBatchAction } from '../src/lib/actions/get-business-object-details-batch';
import { getCustomObjectsAction } from '../src/lib/actions/get-custom-objects';
import { getReportAction } from '../src/lib/actions/get-report';
import { getReportWqlBatchAction } from '../src/lib/actions/get-report-wql-batch';
import { listCustomObjectDefinitionsBatchAction } from '../src/lib/actions/list-custom-object-definitions-batch';
import { searchBusinessObjectBatchAction } from '../src/lib/actions/search-business-object-batch';
import { updateBusinessObjectAction } from '../src/lib/actions/update-business-object';

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

		const out = (await getBusinessObjectDetailsBatchAction.run(
			context({
				module: 'recruiting',
				businessObject: {
					objectType: '__custom__',
					customPath: '/jobPostings',
					customService: 'recruiting/v4',
				},
				objectIds: [{ id: '1' }, { id: '2' }],
			}),
		)) as { total_count: number; records: Record<string, unknown>[] };

		expect(out.total_count).toBe(2);
		expect(out.records[0]).toMatchObject({
			job_requisition_id: '1',
			title: 'Req 1',
		});
		expect(requests()[0].url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/recruiting/v4/mytenant/jobPostings/1',
		);
	});

	it('returns nothing for an empty ID list instead of listing every record', async () => {
		const out = await getBusinessObjectDetailsBatchAction.run(
			context(
				{ source: 'wws', businessObject: { objectType: 'workers' }, objectIds: [] },
				AUTH_WITH_ISU,
			),
		);
		expect(out).toEqual({ total_count: 0, records: [] });
		expect(sendRequest).not.toHaveBeenCalled();
	});
});

describe('search_business_object_batch', () => {
	it('paginates and returns standardized records', async () => {
		sendRequest.mockResolvedValue(
			resp({
				data: [{ id: 'w-1', descriptor: 'Jane', hireDate: '2025-01-01' }],
				total: 1,
			}),
		);

		const out = (await searchBusinessObjectBatchAction.run(
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

		await updateBusinessObjectAction.run(
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

		await callOperationAction.run(
			context({
				module: 'hr_services_time_tracking',
				businessObject: { objectType: 'cases' },
				operationType: 'rest',
				operationName: 'c-1/reopen',
				httpMethod: 'POST',
			}),
		);

		const req = requests()[0];
		expect(req.method).toBe(HttpMethod.POST);
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/helpCase/v4/mytenant/cases/c-1/reopen',
		);
	});

	it('calls a SOAP operation when operationType is soap', async () => {
		sendRequest.mockResolvedValue(
			resp(
				'<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"><soapenv:Body><Result>ok</Result></soapenv:Body></soapenv:Envelope>',
			),
		);

		await callOperationAction.run(
			context(
				{
					module: 'recruiting',
					businessObject: {
						objectType: '__custom__',
						customPath: '/jobPostings',
						customService: 'recruiting/v4',
					},
					operationType: 'soap',
					operationName: 'Close_Job_Requisition',
					soapService: 'Recruiting',
				},
				AUTH_WITH_ISU,
			),
		);

		const req = requests()[0];
		expect(req.url).toContain('/ccx/service/mytenant/Recruiting/');
		expect(String(req.body)).toContain('soapenv:Envelope');
		expect(String(req.body)).toContain(
			'<bsvc:Close_Job_Requisition xmlns:bsvc="urn:com.workday/bsvc"/>',
		);
	});
});

describe('get_custom_objects', () => {
	it('GETs a custom object instance and flattens it', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1', data: { name: 'X' } }));

		const out = (await getCustomObjectsAction.run(
			context({ definitionId: 'apTestInfo', objectId: 'obj-1' }),
		)) as Record<string, unknown>;

		expect(out['data_name']).toBe('X');
		expect(requests()[0].url).toContain('/v1/mytenant/customObjects/apTestInfo/obj-1');
	});
});

describe('get_report', () => {
	it('returns flattened report rows from Report_Entry', async () => {
		sendRequest.mockResolvedValue(
			resp({ Report_Entry: [{ employee_id: 'w-1' }, { employee_id: 'w-2' }] }),
		);

		const out = (await getReportAction.run(
			context({
				reportId: 'lmcneil/PT_Workers',
				reportParameters: undefined,
				format: undefined,
			}),
		)) as { total_count: number; report_id: string };

		expect(out.total_count).toBe(2);
		expect(out.report_id).toBe('lmcneil/PT_Workers');
		expect(requests()[0].url).toContain('/ccx/service/customreport2/mytenant/lmcneil/PT_Workers');
	});

	it('returns CSV text when the format is csv', async () => {
		sendRequest.mockResolvedValue(resp('Worker\nA\n'));

		const out = await getReportAction.run(
			context({
				reportId: 'lmcneil/PT_Workers',
				reportParameters: undefined,
				format: 'csv',
			}),
		);

		expect(out).toEqual({
			report_id: 'lmcneil/PT_Workers',
			csv: 'Worker\nA\n',
		});
	});
});

describe('get_report_wql_batch', () => {
	it('runs a WQL query and returns all rows', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 1 }, { id: 2 }, { id: 3 }] }));

		const out = (await getReportWqlBatchAction.run(
			context({ query: 'SELECT id FROM workers' }),
		)) as { total_count: number };

		expect(out.total_count).toBe(3);
	});
});

describe('list_custom_object_definitions_batch', () => {
	it('lists definitions with a count', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 'def-1' }, { id: 'def-2' }] }));

		const out = (await listCustomObjectDefinitionsBatchAction.run(context({}))) as {
			total_count: number;
		};

		expect(out.total_count).toBe(2);
		expect(requests()[0].url).toContain('/ccx/api/customObjectDefinition/v1/mytenant/definitions');
	});
});

describe('create_update_custom_object', () => {
	it('creates with POST and updateIfExists when no record id is given', async () => {
		sendRequest.mockResolvedValue(resp({ ok: 'Created' }));

		await createUpdateCustomObjectAction.run(
			context({
				definitionId: 'apTestInfo',
				objectId: undefined,
				body: { worker: { id: 'w1' }, note: 'X' },
			}),
		);

		const req = requests()[0];
		expect(req.method).toBe(HttpMethod.POST);
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/customObjects/apTestInfo',
		);
		expect(req.queryParams).toEqual({ updateIfExists: 'true' });
		expect(req.body).toEqual({ worker: { id: 'w1' }, note: 'X' });
	});

	it('updates the record with PUT when a record id is given', async () => {
		sendRequest.mockResolvedValue(resp({ ok: 'OK' }));

		await createUpdateCustomObjectAction.run(
			context({
				definitionId: 'apTestInfo',
				objectId: 'obj-1',
				body: { note: 'X' },
			}),
		);

		const req = requests()[0];
		expect(req.method).toBe(HttpMethod.PUT);
		expect(req.url).toContain('/v1/mytenant/customObjects/apTestInfo/obj-1');
		expect(req.body).toEqual({ note: 'X' });
	});
});

describe('create_time_off_request', () => {
	it('skips weekends and sends a reference ID as Time_Off_Type_ID', async () => {
		sendRequest.mockResolvedValue(
			resp(
				'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><ok/></env:Body></env:Envelope>',
			),
		);
		await createTimeOffRequestAction.run(
			context(
				{
					workerId: 'w1',
					timeOffTypeId: 'Vacation_Hours',
					startDate: '2026-11-06',
					endDate: '2026-11-09',
					hoursPerDay: 4,
				},
				AUTH_WITH_ISU,
			),
		);
		const body = String(requests()[0].body);
		expect(body.match(/<bsvc:Date>/g)).toHaveLength(2);
		expect(body).toContain('<bsvc:Date>2026-11-06</bsvc:Date>');
		expect(body).toContain('<bsvc:Date>2026-11-09</bsvc:Date>');
		expect(body).toContain('<bsvc:Requested>4</bsvc:Requested>');
		expect(body).toContain('bsvc:type="Time_Off_Type_ID">Vacation_Hours<');
	});

	it('sends a 32-character hex value as a WID', async () => {
		sendRequest.mockResolvedValue(
			resp(
				'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><ok/></env:Body></env:Envelope>',
			),
		);
		await createTimeOffRequestAction.run(
			context(
				{
					workerId: 'w1',
					timeOffTypeId: '693618e08cc11001896716301cde0000',
					startDate: '2026-11-02',
					endDate: '2026-11-02',
				},
				AUTH_WITH_ISU,
			),
		);
		expect(String(requests()[0].body)).toContain(
			'bsvc:type="WID">693618e08cc11001896716301cde0000<',
		);
	});

	it('rejects a range with no weekdays', async () => {
		await expect(
			createTimeOffRequestAction.run(
				context(
					{
						workerId: 'w1',
						timeOffTypeId: 'Vacation_Hours',
						startDate: '2026-11-07',
						endDate: '2026-11-08',
					},
					AUTH_WITH_ISU,
				),
			),
		).rejects.toThrow('no weekdays');
	});
});

describe('find_supplier_invoice', () => {
	const ENVELOPE =
		'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><wd:Get_Supplier_Invoices_Response xmlns:wd="urn:com.workday/bsvc"><wd:Response_Data><wd:Supplier_Invoice><wd:Supplier_Invoice_Data><wd:Invoice_Number>SINV-1</wd:Invoice_Number></wd:Supplier_Invoice_Data></wd:Supplier_Invoice></wd:Response_Data></wd:Get_Supplier_Invoices_Response></env:Body></env:Envelope>';

	it('looks up a Supplier Invoice ID and returns the invoice', async () => {
		sendRequest.mockResolvedValue(resp(ENVELOPE));
		const out = (await findSupplierInvoiceAction.run(
			context({ invoiceId: ' SUPPLIER_INVOICE-11-894 ' }, AUTH_WITH_ISU),
		)) as Record<string, Record<string, unknown>>;
		const req = requests()[0];
		expect(req.url).toContain('/ccx/service/mytenant/Resource_Management/');
		expect(String(req.body)).toContain(
			'bsvc:type="Supplier_Invoice_Reference_ID">SUPPLIER_INVOICE-11-894<',
		);
		expect(out['Supplier_Invoice_Data']['Invoice_Number']).toBe('SINV-1');
	});

	it('sends a 32-character hex value as a WID', async () => {
		sendRequest.mockResolvedValue(resp(ENVELOPE));
		await findSupplierInvoiceAction.run(
			context({ invoiceId: '91d942dfcc7a9001456f855817a50000' }, AUTH_WITH_ISU),
		);
		expect(String(requests()[0].body)).toContain(
			'bsvc:type="WID">91d942dfcc7a9001456f855817a50000<',
		);
	});

	it('throws when no invoice comes back', async () => {
		sendRequest.mockResolvedValue(
			resp(
				'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><wd:Get_Supplier_Invoices_Response xmlns:wd="urn:com.workday/bsvc"/></env:Body></env:Envelope>',
			),
		);
		await expect(
			findSupplierInvoiceAction.run(context({ invoiceId: 'SUPPLIER_INVOICE-0' }, AUTH_WITH_ISU)),
		).rejects.toThrow('No supplier invoice found');
	});
});
