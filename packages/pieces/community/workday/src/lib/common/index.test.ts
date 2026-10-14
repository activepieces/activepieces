import {
	HttpMethod,
	HttpRequest,
	HttpResponse,
	httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionType, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	escapeWql,
	fetchAllPages,
	workdayGetCustomObject,
	workdayGetReport,
	workdayBusinessProcessTransactions,
	workdayListCustomObjectDefinitions,
	workdayRequest,
	workdaySoapRequest,
	workdayUpsertCustomObject,
	workdayWqlRequestAll,
	WorkdayService,
} from './index';

const AUTH = {
	access_token: 'tok',
	props: {
		apiHost: 'wd2-impl-services1.workday.com',
		tenant: 'mytenant',
	},
} as unknown as OAuth2PropertyValue;

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

describe('workdayRequest', () => {
	it('builds the tenant-scoped REST URL with a bearer token', async () => {
		sendRequest.mockResolvedValue(resp({ id: 1 }));

		await workdayRequest(
			AUTH,
			HttpMethod.GET,
			'/jobRequisitions/1',
			undefined,
			undefined,
			WorkdayService.staffing,
		);

		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/staffing/v6/mytenant/jobRequisitions/1',
		);
		expect(req.authentication).toMatchObject({ token: 'tok' });
	});
});

describe('fetchAllPages', () => {
	it('paginates until fewer than a full page is returned', async () => {
		const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const lastPage = Array.from({ length: 50 }, (_, i) => ({ id: 100 + i }));
		sendRequest.mockImplementation(async (request: HttpRequest) => {
			const offset = Number(request.queryParams?.['offset'] ?? 0);
			return resp({ data: offset === 0 ? fullPage : lastPage, total: 150 });
		});

		const all = await fetchAllPages(AUTH, '/workers');
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

		const all = await fetchAllPages(AUTH, '/workers');
		expect(all).toHaveLength(110);
		expect(sendRequest.mock.calls).toHaveLength(2);
	});
});

describe('workdayWqlRequestAll', () => {
	it('returns the data array from the WQL response', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 1 }, { id: 2 }] }));
		const rows = await workdayWqlRequestAll(AUTH, 'SELECT id FROM workers');
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

		const rows = await workdayWqlRequestAll(AUTH, 'SELECT id FROM workers');
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

		const rows = await workdayWqlRequestAll(AUTH, 'SELECT id FROM workers');
		expect(rows).toHaveLength(1025);
		expect(sendRequest.mock.calls).toHaveLength(2);
	});
});

describe('workdayGetReport', () => {
	const RAAS = 'https://wd2-impl-services1.workday.com/ccx/service/customreport2/mytenant/lmcneil/PT_Workers';

	it('calls RaaS for owner/report with prompts and format', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [{ Worker: 'A' }] }));
		const report = await workdayGetReport({
			auth: AUTH,
			report: 'lmcneil/PT_Workers',
			parameters: { Start_Date: '2026-10-01', 'Organizations!WID': ['o1', 'o2'], Count: 2 },
		});
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(RAAS);
		expect(req.queryParams).toEqual({ Start_Date: '2026-10-01', 'Organizations!WID': 'o1!o2', Count: '2', format: 'json' });
		expect(req.authentication).toMatchObject({ token: 'tok' });
		expect(report).toEqual({ reportPath: 'lmcneil/PT_Workers', format: 'json', rows: [{ Worker: 'A' }] });
	});

	it('rebuilds a pasted RaaS URL and keeps its prompts, letting explicit prompts override', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [] }));
		await workdayGetReport({
			auth: AUTH,
			report: ` ${RAAS}?Start_Date=2026-01-01&Employee_ID_s_=21001&format=csv `,
			parameters: { Start_Date: '2026-10-01' },
		});
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(RAAS);
		expect(req.queryParams).toEqual({ Start_Date: '2026-10-01', Employee_ID_s_: '21001', format: 'json' });
	});

	it('returns no rows for a report without Report_Entry', async () => {
		sendRequest.mockResolvedValue(resp({}));
		const report = await workdayGetReport({ auth: AUTH, report: 'lmcneil/PT_Workers' });
		expect(report).toEqual({ reportPath: 'lmcneil/PT_Workers', format: 'json', rows: [] });
	});

	it('returns CSV text when asked', async () => {
		sendRequest.mockResolvedValue(resp('Worker\nA\n'));
		const report = await workdayGetReport({ auth: AUTH, report: 'lmcneil/PT_Workers', format: 'csv' });
		expect((sendRequest.mock.calls[0][0] as HttpRequest).queryParams).toEqual({ format: 'csv' });
		expect(report).toEqual({ reportPath: 'lmcneil/PT_Workers', format: 'csv', csv: 'Worker\nA\n' });
	});

	it('refuses a URL on another host', async () => {
		await expect(
			workdayGetReport({ auth: AUTH, report: 'https://evil.example.com/ccx/service/customreport2/mytenant/lmcneil/PT_Workers' }),
		).rejects.toThrow('does not match the connection\'s API host');
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('refuses a URL for another tenant', async () => {
		await expect(
			workdayGetReport({ auth: AUTH, report: 'https://wd2-impl-services1.workday.com/ccx/service/customreport2/other/lmcneil/PT_Workers' }),
		).rejects.toThrow('does not match the connection\'s tenant');
	});

	it('refuses a reference that is neither a RaaS URL nor owner/report', async () => {
		await expect(workdayGetReport({ auth: AUTH, report: 'Worker_Report' })).rejects.toThrow('owner/report_name');
		await expect(
			workdayGetReport({ auth: AUTH, report: 'https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/reports/x' }),
		).rejects.toThrow('not a Workday RaaS URL');
	});
});

describe('custom object helpers', () => {
	it('lists custom object definitions', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 'def-1' }] }));
		const defs = await workdayListCustomObjectDefinitions(AUTH);
		expect(defs).toHaveLength(1);
		expect((sendRequest.mock.calls[0][0] as HttpRequest).url).toContain(
			'/ccx/api/customObjectDefinition/v1/mytenant/definitions',
		);
	});

	it('gets a custom object record by alias and record id', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1' }));
		await workdayGetCustomObject({ auth: AUTH, alias: 'apTestInfo', objectId: 'obj-1' });
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.method).toBe(HttpMethod.GET);
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/customObjects/apTestInfo/obj-1',
		);
	});

	it('creates with POST and updateIfExists when no record id is given', async () => {
		sendRequest.mockResolvedValue(resp({ ok: 'Created' }));
		await workdayUpsertCustomObject({ auth: AUTH, alias: 'apTestInfo', body: { worker: { id: 'w1' }, note: 'x' } });
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.method).toBe(HttpMethod.POST);
		expect(req.url).toBe('https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/customObjects/apTestInfo');
		expect(req.queryParams).toEqual({ updateIfExists: 'true' });
		expect(req.body).toEqual({ worker: { id: 'w1' }, note: 'x' });
	});

	it('updates with PUT on the record when a record id is given', async () => {
		sendRequest.mockResolvedValue(resp({ ok: 'OK' }));
		await workdayUpsertCustomObject({ auth: AUTH, alias: 'apTestInfo', objectId: 'obj-1', body: { note: 'x' } });
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.method).toBe(HttpMethod.PUT);
		expect(req.url).toBe('https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/customObjects/apTestInfo/obj-1');
		expect(req.body).toEqual({ note: 'x' });
	});
});

describe('escapeWql', () => {
	it('backslash-escapes single quotes', () => {
		expect(escapeWql("O'Brien")).toBe("O\\'Brien");
	});

	it('escapes backslashes before quotes', () => {
		expect(escapeWql("a\\'b")).toBe("a\\\\\\'b");
	});
});

describe('workdayBusinessProcessTransactions', () => {
	it('filters by moment, type and status and orders newest first', async () => {
		sendRequest.mockResolvedValue(resp({ data: [] }));
		await workdayBusinessProcessTransactions({
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
		await workdayBusinessProcessTransactions({ auth: AUTH, momentField: 'dateAndTimeInitiated', sinceEpochMS: 0 });
		const query = (sendRequest.mock.calls[0][0] as HttpRequest<{ query: string }>).body?.query;
		expect(query).toContain("dateAndTimeInitiated > '1970-01-01T00:00:00.000Z' ORDER BY dateAndTimeInitiated DESC LIMIT 10");
	});
});

describe('Integration System User connection', () => {
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

	it('sends SOAP to the default v47.0 with username@tenant and XML-escaped credentials', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdaySoapRequest(ISU_AUTH, 'Human_Resources', '<bsvc:Server_Timestamp_Get/>');
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe('https://wd2-impl-services1.workday.com/ccx/service/mytenant/Human_Resources/v47.0');
		expect(String(req.body)).toContain('<wsse:Username>isu_ap@mytenant</wsse:Username>');
		expect(String(req.body)).toContain('>p&lt;&amp;&gt;&quot;&apos;w</wsse:Password>');
	});

	it('uses the configured WWS version and rejects a malformed one', async () => {
		sendRequest.mockResolvedValue(resp(SOAP_OK));
		await workdaySoapRequest({ ...ISU_AUTH, props: { ...ISU_AUTH.props, wwsVersion: 'v45.0' } }, 'Staffing', '<x/>');
		expect((sendRequest.mock.calls[0][0] as HttpRequest).url).toContain('/Staffing/v45.0');
		await expect(
			workdaySoapRequest({ ...ISU_AUTH, props: { ...ISU_AUTH.props, wwsVersion: '../v1' } }, 'Staffing', '<x/>'),
		).rejects.toThrow('is not valid');
	});

	it('runs RaaS with Basic auth and the bare username', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [] }));
		await workdayGetReport({
			auth: { ...ISU_AUTH, props: { ...ISU_AUTH.props, username: 'isu_ap@mytenant' } },
			report: 'lmcneil/PT_Workers',
		});
		expect((sendRequest.mock.calls[0][0] as HttpRequest).authentication).toEqual({
			type: 'BASIC',
			username: 'isu_ap',
			password: 'p<&>"\'w',
		});
	});

	it('refuses REST and WQL calls with a clear message', async () => {
		await expect(workdayRequest(ISU_AUTH, HttpMethod.GET, '/workers')).rejects.toThrow('needs the OAuth 2.0 connection');
		await expect(workdayWqlRequestAll(ISU_AUTH, 'SELECT worker FROM allWorkers')).rejects.toThrow(
			'needs the OAuth 2.0 connection',
		);
		expect(sendRequest).not.toHaveBeenCalled();
	});
});
