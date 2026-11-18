import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';

import { workdayApi } from '../src/lib/common/api';
import { workdayClient } from '../src/lib/common/client';
import { workdayUtils } from '../src/lib/common/utils';

const AUTH = {
	type: AppConnectionType.OAUTH2,
	access_token: 'tok',
	props: {
		apiHost: 'wd2-impl-services1.workday.com',
		tenant: 'mytenant',
	},
} as const;

const ISU_AUTH = {
	type: AppConnectionType.CUSTOM_AUTH,
	props: {
		apiHost: 'wd2-impl-services1.workday.com',
		tenant: 'mytenant',
		username: 'isu_ap',
		password: 'p<&>"\'w',
		wwsVersion: '',
	},
} as const;
const SOAP_OK =
	'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/"><env:Body><ok/></env:Body></env:Envelope>';

function resp(body: unknown): HttpResponse {
	return { status: 200, headers: {}, body };
}

let sendRequest: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe('workdayClient.request', () => {
	it('builds the tenant-scoped REST URL with a bearer token', async () => {
		sendRequest.mockResolvedValue(resp({ id: 1 }));

		await workdayClient.request({
			auth: AUTH,
			method: HttpMethod.GET,
			path: '/workers/1',
			service: 'staffing/v6',
		});

		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/staffing/v6/mytenant/workers/1',
		);
		expect(req.authentication).toMatchObject({ token: 'tok' });
	});
});

describe('workdayClient.paginate', () => {
	it('paginates until fewer than a full page is returned', async () => {
		const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const lastPage = Array.from({ length: 50 }, (_, i) => ({ id: 100 + i }));
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const offset = Number(request.queryParams?.['offset'] ?? 0);
			return resp({ data: offset === 0 ? fullPage : lastPage, total: 150 });
		});

		const all = await workdayClient.paginate({ auth: AUTH, path: '/workers' });
		expect(all).toHaveLength(150);
		expect(sendRequest.mock.calls).toHaveLength(2);
	});

	it('keeps paginating past the first full page when the API omits total', async () => {
		const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const lastPage = Array.from({ length: 10 }, (_, i) => ({ id: 100 + i }));
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const offset = Number(request.queryParams?.['offset'] ?? 0);
			return resp({ data: offset === 0 ? fullPage : lastPage });
		});

		const all = await workdayClient.paginate({ auth: AUTH, path: '/workers' });
		expect(all).toHaveLength(110);
		expect(sendRequest.mock.calls).toHaveLength(2);
	});
});

describe('workdayApi.runWqlAll', () => {
	it('returns the data array from the WQL response', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 1 }, { id: 2 }] }));
		const rows = await workdayApi.runWqlAll({
			auth: AUTH,
			query: 'SELECT id FROM workers',
		});
		expect(rows).toHaveLength(2);
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toContain('/ccx/api/wql/v1/mytenant/data');
	});

	it('paginates until all rows are fetched', async () => {
		const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
		const lastPage = Array.from({ length: 500 }, (_, i) => ({ id: 1000 + i }));
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const offset = Number(request.queryParams?.['offset'] ?? 0);
			return resp({ data: offset === 0 ? fullPage : lastPage, total: 1500 });
		});

		const rows = await workdayApi.runWqlAll({
			auth: AUTH,
			query: 'SELECT id FROM workers',
		});
		expect(rows).toHaveLength(1500);
		expect(sendRequest.mock.calls).toHaveLength(2);
	});

	it('keeps paginating past the first full page when the API omits total', async () => {
		const fullPage = Array.from({ length: 1000 }, (_, i) => ({ id: i }));
		const lastPage = Array.from({ length: 25 }, (_, i) => ({ id: 1000 + i }));
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const offset = Number(request.queryParams?.['offset'] ?? 0);
			return resp({ data: offset === 0 ? fullPage : lastPage });
		});

		const rows = await workdayApi.runWqlAll({
			auth: AUTH,
			query: 'SELECT id FROM workers',
		});
		expect(rows).toHaveLength(1025);
		expect(sendRequest.mock.calls).toHaveLength(2);
	});
});

describe('workdayApi.getReport', () => {
	const RAAS =
		'https://wd2-impl-services1.workday.com/ccx/service/customreport2/mytenant/lmcneil/PT_Workers';

	it('calls RaaS for owner/report with prompts and format', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [{ Worker: 'A' }] }));
		const report = await workdayApi.getReport({
			auth: AUTH,
			report: 'lmcneil/PT_Workers',
			parameters: {
				Start_Date: '2026-10-01',
				'Organizations!WID': ['o1', 'o2'],
				Count: 2,
			},
		});
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(RAAS);
		expect(req.queryParams).toEqual({
			Start_Date: '2026-10-01',
			'Organizations!WID': 'o1!o2',
			Count: '2',
			format: 'json',
		});
		expect(req.authentication).toMatchObject({ token: 'tok' });
		expect(report).toEqual({
			reportPath: 'lmcneil/PT_Workers',
			format: 'json',
			rows: [{ Worker: 'A' }],
		});
	});

	it('rebuilds a pasted RaaS URL and keeps its prompts, letting explicit prompts override', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [] }));
		await workdayApi.getReport({
			auth: AUTH,
			report: ` ${RAAS}?Start_Date=2026-01-01&Employee_ID_s_=21001&format=csv `,
			parameters: { Start_Date: '2026-10-01' },
		});
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(RAAS);
		expect(req.queryParams).toEqual({
			Start_Date: '2026-10-01',
			Employee_ID_s_: '21001',
			format: 'json',
		});
	});

	it('returns no rows for a report without Report_Entry', async () => {
		sendRequest.mockResolvedValue(resp({}));
		const report = await workdayApi.getReport({
			auth: AUTH,
			report: 'lmcneil/PT_Workers',
		});
		expect(report).toEqual({
			reportPath: 'lmcneil/PT_Workers',
			format: 'json',
			rows: [],
		});
	});

	it('refuses a URL on another host', async () => {
		await expect(
			workdayApi.getReport({
				auth: AUTH,
				report: 'https://evil.example.com/ccx/service/customreport2/mytenant/lmcneil/PT_Workers',
			}),
		).rejects.toThrow("does not match the connection's API host");
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('refuses a URL for another tenant', async () => {
		await expect(
			workdayApi.getReport({
				auth: AUTH,
				report:
					'https://wd2-impl-services1.workday.com/ccx/service/customreport2/other/lmcneil/PT_Workers',
			}),
		).rejects.toThrow("does not match the connection's tenant");
	});

	it('refuses a reference that is neither a RaaS URL nor owner/report', async () => {
		await expect(workdayApi.getReport({ auth: AUTH, report: 'Worker_Report' })).rejects.toThrow(
			'owner/report_name',
		);
		await expect(
			workdayApi.getReport({
				auth: AUTH,
				report: 'https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/reports/x',
			}),
		).rejects.toThrow('not a Workday RaaS URL');
	});
});

describe('WQL escaping', () => {
	it('backslash-escapes single quotes and backslashes in lookups', async () => {
		sendRequest.mockResolvedValue(resp({ data: [] }));
		await workdayApi.findSupplier({ auth: AUTH, supplierId: "a\\'b" });
		const query = (sendRequest.mock.calls[0][0] as HttpRequest<{ query: string }>).body?.query;
		expect(query).toBe("SELECT supplier, supplierName FROM suppliers WHERE supplier = 'a\\\\\\'b'");
	});
});

describe('workdayApi.findPurchaseOrder', () => {
	it('names the required purchase orders filter', async () => {
		sendRequest.mockResolvedValue(resp({ data: [] }));
		await workdayApi.findPurchaseOrder({ auth: AUTH, purchaseOrderId: 'po-1' });
		const query = (sendRequest.mock.calls[0][0] as HttpRequest<{ query: string }>).body?.query;
		expect(query).toBe(
			"SELECT purchaseOrder FROM purchaseOrders(dataSourceFilter = purchaseOrdersFilter) WHERE purchaseOrder = 'po-1'",
		);
	});
});

describe('workdayApi.findSupplierPayments', () => {
	it('filters the data source by every visible company', async () => {
		const companyA = 'a'.repeat(32);
		const companyB = 'b'.repeat(32);
		sendRequest
			.mockResolvedValueOnce(
				resp({
					data: [{ company: { id: companyA } }, { company: { id: companyB } }],
				}),
			)
			.mockResolvedValueOnce(resp({ total: 0, data: [] }));
		await workdayApi.findSupplierPayments({ auth: AUTH, supplierId: 's1' });
		const query = (sendRequest.mock.calls[1][0] as HttpRequest<{ query: string }>).body?.query;
		expect(query).toBe(
			`SELECT supplierPayment FROM supplierPayments(dataSourceFilter = supplierPaymentsFilter, company = (${companyA}, ${companyB})) WHERE supplier = 's1'`,
		);
	});

	it('returns an empty page without querying payments when no company is visible', async () => {
		sendRequest.mockResolvedValueOnce(resp({ data: [] }));
		const page = await workdayApi.findSupplierPayments({ auth: AUTH });
		expect(page).toEqual({ total: 0, data: [] });
		expect(sendRequest).toHaveBeenCalledTimes(1);
	});
});

describe('workdayApi.listBusinessProcessTransactions', () => {
	it('filters by moment, type and status and orders newest first', async () => {
		sendRequest.mockResolvedValue(resp({ data: [] }));
		await workdayApi.listBusinessProcessTransactions({
			auth: AUTH,
			momentField: 'dateAndTimeCompleted',
			sinceEpochMS: Date.parse('2026-10-14T00:00:00.000Z'),
			typeIds: ['t1', 't2'],
			completedOnly: true,
		});
		const query = (sendRequest.mock.calls[0][0] as HttpRequest<{ query: string }>).body?.query;
		expect(query).toBe(
			"SELECT businessProcessEvent, businessProcessType, status, worker, subject, dateAndTimeInitiated, dateAndTimeCompleted FROM businessProcessTransactions WHERE dateAndTimeCompleted > '2026-10-14T00:00:00.000Z' AND businessProcessType in ('t1', 't2') AND status = 'Successfully Completed' ORDER BY dateAndTimeCompleted DESC",
		);
	});

	it('limits the first test fetch to 10 rows', async () => {
		sendRequest.mockResolvedValue(resp({ data: [] }));
		await workdayApi.listBusinessProcessTransactions({
			auth: AUTH,
			momentField: 'dateAndTimeInitiated',
			sinceEpochMS: 0,
		});
		const query = (sendRequest.mock.calls[0][0] as HttpRequest<{ query: string }>).body?.query;
		expect(query).toContain(
			"dateAndTimeInitiated > '1970-01-01T00:00:00.000Z' ORDER BY dateAndTimeInitiated DESC LIMIT 10",
		);
	});
});

describe('Integration System User connection', () => {
	it('sends SOAP to the default v47.0 with username@tenant and XML-escaped credentials', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayApi.getServerTimestamp({ auth: ISU_AUTH });
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/service/mytenant/Human_Resources/v47.0',
		);
		expect(String(req.body)).toContain('<wsse:Username>isu_ap@mytenant</wsse:Username>');
		expect(String(req.body)).toContain('>p&lt;&amp;&gt;&quot;&apos;w</wsse:Password>');
	});

	it('uses the configured WWS version and rejects a malformed one', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayClient.soap({
			auth: { ...ISU_AUTH, props: { ...ISU_AUTH.props, wwsVersion: 'v45.0' } },
			service: 'Staffing',
			operationXml: '<x/>',
		});
		expect((sendRequest.mock.calls[0][0] as HttpRequest).url).toContain('/Staffing/v45.0');
		await expect(
			workdayClient.soap({
				auth: {
					...ISU_AUTH,
					props: { ...ISU_AUTH.props, wwsVersion: '../v1' },
				},
				service: 'Staffing',
				operationXml: '<x/>',
			}),
		).rejects.toThrow('is not valid');
	});

	it('runs RaaS with Basic auth and the bare username', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [] }));
		await workdayApi.getReport({
			auth: {
				...ISU_AUTH,
				props: { ...ISU_AUTH.props, username: 'isu_ap@mytenant' },
			},
			report: 'lmcneil/PT_Workers',
		});
		expect((sendRequest.mock.calls[0][0] as HttpRequest).authentication).toEqual({
			type: 'BASIC',
			username: 'isu_ap',
			password: 'p<&>"\'w',
		});
	});

	it('refuses REST and WQL calls with a clear message', async () => {
		await expect(
			workdayClient.request({
				auth: ISU_AUTH,
				method: HttpMethod.GET,
				path: '/workers',
			}),
		).rejects.toThrow('needs the OAuth 2.0 connection');
		await expect(
			workdayApi.runWqlAll({
				auth: ISU_AUTH,
				query: 'SELECT worker FROM allWorkers',
			}),
		).rejects.toThrow('needs the OAuth 2.0 connection');
		expect(sendRequest).not.toHaveBeenCalled();
	});
});

describe('SOAP request bodies', () => {
	it('reads time off dates as strict UTC YYYY-MM-DD and rejects anything else', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		const request = {
			auth: ISU_AUTH,
			workerId: 'w',
			timeOffTypeId: 'Vacation',
		};
		await workdayApi.createTimeOffRequest({
			...request,
			startDate: ' 2026-11-03 ',
			endDate: '2026-11-03',
		});
		expect(String((sendRequest.mock.calls[0][0] as HttpRequest).body)).toContain(
			'<bsvc:Date>2026-11-03</bsvc:Date>',
		);
		await expect(
			workdayApi.createTimeOffRequest({
				...request,
				startDate: '11/03/2026',
				endDate: '2026-11-03',
			}),
		).rejects.toThrow('Start Date must be a date in YYYY-MM-DD format');
		await expect(
			workdayApi.createTimeOffRequest({
				...request,
				startDate: '2026-11-03',
				endDate: '2026-02-30',
			}),
		).rejects.toThrow('End Date must be a date in YYYY-MM-DD format');
		await expect(
			workdayApi.createTimeOffRequest({
				...request,
				startDate: '2026-11-10',
				endDate: '2026-11-03',
			}),
		).rejects.toThrow('End Date must be on or after Start Date.');
	});

	it('reports time blocks synchronously so Workday validates them in the call', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayApi.createWorkerTimeBlock({
			auth: ISU_AUTH,
			workerId: 'w',
			date: '2026-10-13',
			hours: 1,
		});
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toContain('/Time_Tracking/');
		expect(String(req.body)).toContain('<bsvc:Put_Reported_Time_Blocks_for_Worker_Request');
	});

	it('sends the approval comment inside Approve_Business_Process_Data', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayApi.approveTask({
			auth: ISU_AUTH,
			taskId: 'e',
			comment: 'ok',
		});
		const body = String((sendRequest.mock.calls[0][0] as HttpRequest).body);
		expect(body).toContain(
			'<bsvc:Approve_Business_Process_Data>\n        <bsvc:Comment>ok</bsvc:Comment>',
		);
		expect(body).not.toContain('Business_Process_Comment_Data');
	});

	it('sends a supplier tax ID with its type without replacing other tax IDs', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayApi.updateSupplier({
			auth: ISU_AUTH,
			supplierId: 's',
			taxId: '12-3456789',
			taxIdType: 'USA-EIN',
		});
		const body = String((sendRequest.mock.calls[0][0] as HttpRequest).body);
		expect(body).toContain('<bsvc:Tax_ID_Widget_Data bsvc:Replace_All="false">');
		expect(body).toContain('<bsvc:Tax_ID_Text>12-3456789</bsvc:Tax_ID_Text>');
		expect(body).toContain('<bsvc:ID bsvc:type="Tax_ID_Type">USA-EIN</bsvc:ID>');
		expect(body).not.toContain('<bsvc:Tax_ID>');
	});

	it('sends supplier invoice fields with schema names in schema order', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayApi.updateSupplierInvoice({
			auth: ISU_AUTH,
			invoiceId: 'i',
			invoiceDate: '2026-10-14',
			invoiceNumber: 'SINV-1',
			total: '100.00',
		});
		const body = String((sendRequest.mock.calls[0][0] as HttpRequest).body);
		expect(body).toContain('<bsvc:Control_Amount_Total>100.00</bsvc:Control_Amount_Total>');
		expect(body).not.toContain('Total_Amount>100');
		expect(body.indexOf('<bsvc:Invoice_Number>')).toBeLessThan(body.indexOf('<bsvc:Invoice_Date>'));
	});

	it('rejects a tax ID without its type', async () => {
		await expect(
			workdayApi.updateSupplier({
				auth: ISU_AUTH,
				supplierId: 's',
				taxId: '12-3456789',
			}),
		).rejects.toThrow('Tax ID and Tax ID Type must be set together');
		expect(sendRequest).not.toHaveBeenCalled();
	});
});

describe('SOAP business object paging', () => {
	function workersPage({ page, totalPages }: { page: number; totalPages: number }): string {
		return `<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wd="urn:com.workday/bsvc"><env:Body><wd:Get_Workers_Response><wd:Response_Filter><wd:As_Of_Entry_DateTime>2026-10-02T00:00:00.000Z</wd:As_Of_Entry_DateTime></wd:Response_Filter><wd:Response_Results><wd:Total_Pages>${totalPages}</wd:Total_Pages><wd:Page>${page}</wd:Page></wd:Response_Results><wd:Response_Data><wd:Worker><wd:Worker_Reference><wd:ID wd:type="WID">w${page}</wd:ID></wd:Worker_Reference></wd:Worker></wd:Response_Data></wd:Get_Workers_Response></env:Body></env:Envelope>`;
	}

	it('fetches every page and reuses the first page as-of time', async () => {
		sendRequest
			.mockResolvedValueOnce(resp(workersPage({ page: 1, totalPages: 2 })))
			.mockResolvedValueOnce(resp(workersPage({ page: 2, totalPages: 2 })));
		const records = await workdayApi.listSoapObjects({
			auth: ISU_AUTH,
			object: workdayUtils.resolveSoapObject({ value: 'workers' }),
		});
		expect(records.map((record) => record['id'])).toEqual(['w1', 'w2']);
		const second = String((sendRequest.mock.calls[1][0] as HttpRequest).body);
		expect(second).toContain(
			'<bsvc:As_Of_Entry_DateTime>2026-10-02T00:00:00.000Z</bsvc:As_Of_Entry_DateTime><bsvc:Page>2</bsvc:Page>',
		);
		expect((sendRequest.mock.calls[0][0] as HttpRequest).url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/service/mytenant/Human_Resources/v47.0',
		);
	});

	it('fetches every page when no limit is given, so triggers never drop changes', async () => {
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const page = Number(/<bsvc:Page>(\d+)<\/bsvc:Page>/.exec(String(request.body))?.[1] ?? 1);
			return resp(workersPage({ page, totalPages: 51 }));
		});
		const records = await workdayApi.listSoapObjects({
			auth: ISU_AUTH,
			object: workdayUtils.resolveSoapObject({ value: 'workers' }),
		});
		expect(sendRequest).toHaveBeenCalledTimes(51);
		expect(records.at(-1)?.['id']).toBe('w51');
	});

	it("ends the change window at Workday's own clock, not ours", async () => {
		sendRequest
			.mockResolvedValueOnce(
				resp(
					'<env:Envelope xmlns:env="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wd="urn:com.workday/bsvc"><env:Body><wd:Server_Timestamp><wd:Server_Timestamp_Data>2026-10-15T01:00:00.000-07:00</wd:Server_Timestamp_Data></wd:Server_Timestamp></env:Body></env:Envelope>',
				),
			)
			.mockResolvedValueOnce(resp(workersPage({ page: 1, totalPages: 1 })));
		const result = await workdayApi.listChangedSoapObjects({
			auth: ISU_AUTH,
			object: workdayUtils.resolveSoapObject({ value: 'workers' }),
			sinceEpochMS: Date.parse('2026-10-15T07:00:00.000Z'),
		});
		const body = String((sendRequest.mock.calls[1][0] as HttpRequest).body);
		expect(body).toContain('<bsvc:Updated_From>2026-10-15T07:00:00.000Z</bsvc:Updated_From>');
		expect(body).toContain('<bsvc:Updated_Through>2026-10-15T08:00:00.000Z</bsvc:Updated_Through>');
		expect(result.updatedThroughEpochMS).toBe(Date.parse('2026-10-15T08:00:00.000Z'));
		expect(result.records.map((record) => record['id'])).toEqual(['w1']);
	});

	it('only fetches payees by ID', async () => {
		await expect(
			workdayApi.listSoapObjects({
				auth: ISU_AUTH,
				object: workdayUtils.resolveSoapObject({ value: 'payees' }),
			}),
		).rejects.toThrow('Payee can only be fetched by ID. Use Get Business Object Details.');
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('refuses to watch objects without change tracking', async () => {
		await expect(
			workdayApi.listChangedSoapObjects({
				auth: ISU_AUTH,
				object: workdayUtils.resolveSoapObject({ value: 'locations' }),
				sinceEpochMS: 0,
			}),
		).rejects.toThrow("Workday does not track changes for Location, so it can't be watched.");
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('uses a per-call WWS version when given', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdayApi.callSoapOperation({
			auth: ISU_AUTH,
			service: 'Staffing',
			operationXml: '<bsvc:Get_Positions_Request/>',
			version: 'v45.0',
		});
		expect((sendRequest.mock.calls[0][0] as HttpRequest).url).toContain('/Staffing/v45.0');
	});
});
