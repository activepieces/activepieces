import {
	HttpMethod,
	HttpRequest,
	HttpResponse,
	httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	escapeWql,
	fetchAllPages,
	workdayGetCustomObject,
	workdayGetReport,
	workdayListCustomObjectDefinitions,
	workdayRequest,
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
	it('GETs the report by id on the common service', async () => {
		sendRequest.mockResolvedValue(resp({ Report_Entry: [{ id: 1 }] }));
		await workdayGetReport(AUTH, 'Worker_Report');
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toBe(
			'https://wd2-impl-services1.workday.com/ccx/api/v1/mytenant/reports/Worker_Report',
		);
	});
});

describe('custom object helpers', () => {
	it('lists custom object definitions', async () => {
		sendRequest.mockResolvedValue(resp({ data: [{ id: 'def-1' }] }));
		const defs = await workdayListCustomObjectDefinitions(AUTH);
		expect(defs).toHaveLength(1);
		expect((sendRequest.mock.calls[0][0] as HttpRequest).url).toContain(
			'/customObjects/v1/mytenant/customObjectDefinitions',
		);
	});

	it('gets a custom object instance by id', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1' }));
		await workdayGetCustomObject(AUTH, 'def-1', 'obj-1');
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.url).toContain('/customObjects/v1/mytenant/customObjects/def-1');
		expect(req.queryParams).toEqual({ id: 'obj-1' });
	});

	it('upserts a custom object with PUT', async () => {
		sendRequest.mockResolvedValue(resp({ id: 'obj-1' }));
		await workdayUpsertCustomObject(AUTH, 'def-1', { name: 'x' });
		const req = sendRequest.mock.calls[0][0] as HttpRequest;
		expect(req.method).toBe(HttpMethod.PUT);
		expect(req.body).toEqual({ name: 'x' });
	});
});

describe('escapeWql', () => {
	it('doubles single quotes', () => {
		expect(escapeWql("O'Brien")).toBe("O''Brien");
	});
});
