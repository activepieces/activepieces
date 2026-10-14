import {
	AuthenticationType,
	HttpMethod,
	HttpMessageBody,
	HttpResponse,
	httpClient,
	QueryParams,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { XMLParser } from 'fast-xml-parser';

const DEFAULT_HOST = 'wd2-impl-services1.workday.com';
const WQL_BASE = 'wql/v1';
const SOAP_VERSION = 'v46.0';

function getHost(auth: OAuth2PropertyValue): string {
	return (auth?.props?.['apiHost'] as string) ?? DEFAULT_HOST;
}

export const WorkdayService = {
	common: 'v1',
	staffing: 'staffing/v6',
	procurement: 'procurement/v5',
	accountsPayable: 'accountsPayable/v1',
	expenseManagement: 'expense/v1',
	timeTracking: 'timeTracking/v7',
	helpCase: 'helpCase/v4',
	customObjectDefinition: 'customObjectDefinition/v1',
} as const;

export type ServicePath = typeof WorkdayService[keyof typeof WorkdayService];

function getTenant(auth: OAuth2PropertyValue): string {
	if (!auth) return '';
	return auth.props?.['tenant'] ?? '';
}

export async function workdayRequest<T extends HttpMessageBody>(
	auth: OAuth2PropertyValue,
	method: HttpMethod,
	path: string,
	body?: Record<string, unknown>,
	queryParams?: QueryParams,
	service: ServicePath = WorkdayService.common,
): Promise<HttpResponse<T>> {
	const tenant = getTenant(auth);
	return httpClient.sendRequest<T>({
		method,
		url: `https://${getHost(auth)}/ccx/api/${service}/${tenant}${path}`,
		body,
		queryParams,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.access_token,
		},
	});
}

export async function workdayWqlRequest<T extends HttpMessageBody>(
	auth: OAuth2PropertyValue,
	query: string,
	limit?: number,
	offset?: number,
): Promise<HttpResponse<T>> {
	if (!auth || !auth.access_token) {
		throw new Error('Workday connection is not configured. Please select a valid Workday connection.');
	}
	const tenant = getTenant(auth);
	const queryParams: QueryParams = {};
	if (limit !== undefined) queryParams['limit'] = String(limit);
	if (offset !== undefined) queryParams['offset'] = String(offset);
	return httpClient.sendRequest<T>({
		method: HttpMethod.POST,
		url: `https://${getHost(auth)}/ccx/api/${WQL_BASE}/${tenant}/data`,
		body: { query },
		queryParams,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.access_token,
		},
	});
}

export async function fetchAllPages<T>(
	auth: OAuth2PropertyValue,
	path: string,
	queryParams?: QueryParams,
	dataKey = 'data',
	service: ServicePath = WorkdayService.common,
): Promise<T[]> {
	const allItems: T[] = [];
	const limit = 100;
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const response = await workdayRequest<Record<string, unknown>>(
			auth,
			HttpMethod.GET,
			path,
			undefined,
			{ ...queryParams, limit: String(limit), offset: String(offset) },
			service,
		);

		const items = (response.body[dataKey] ?? []) as T[];
		allItems.push(...items);
		offset += limit;

		// A short page is the only reliable end signal. `total` stops us one
		// round-trip early, but ONLY when the API returns it — falling back to
		// allItems.length would halt after the first full page.
		if (items.length < limit) {
			hasMore = false;
		} else {
			const total = response.body['total'];
			hasMore = typeof total !== 'number' || offset < total;
		}
	}

	return allItems;
}

function getIsuCredentials(auth: OAuth2PropertyValue): {
	username: string;
	password: string;
} {
	const username = auth.props?.['isuUsername'] as string | undefined;
	const password = auth.props?.['isuPassword'] as string | undefined;
	if (!username || !password) {
		throw new Error(
			'ISU Username and Password are required for write operations. Please update your Workday connection with Integration System User credentials.',
		);
	}
	return { username, password };
}

function buildSoapEnvelope(
	username: string,
	password: string,
	operationXml: string,
): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bsvc="urn:com.workday/bsvc">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" soapenv:mustUnderstand="1">
      <wsse:UsernameToken>
        <wsse:Username>${username}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${password}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    ${operationXml}
  </soapenv:Body>
</soapenv:Envelope>`;
}

export async function workdaySoapRequest(
	auth: OAuth2PropertyValue,
	soapService: string,
	operationXml: string,
): Promise<Record<string, unknown>> {
	const tenant = getTenant(auth);
	const { username, password } = getIsuCredentials(auth);
	const envelope = buildSoapEnvelope(username, password, operationXml);

	const response = await httpClient.sendRequest({
		method: HttpMethod.POST,
		url: `https://${getHost(auth)}/ccx/service/${tenant}/${soapService}/${SOAP_VERSION}`,
		headers: {
			'Content-Type': 'text/xml;charset=UTF-8',
		},
		body: envelope,
	});

	const parser = new XMLParser({
		ignoreAttributes: false,
		removeNSPrefix: true,
		parseAttributeValue: true,
	});

	const parsed = parser.parse(
		typeof response.body === 'string'
			? response.body
			: JSON.stringify(response.body),
	) as Record<string, unknown>;

	const soapEnvelope = parsed['Envelope'] as Record<string, unknown> | undefined;
	const soapBody = soapEnvelope?.['Body'] as Record<string, unknown> | undefined;

	if (soapBody?.['Fault']) {
		const fault = soapBody['Fault'] as Record<string, unknown>;
		const faultString = fault['faultstring'] ?? fault['Reason'] ?? 'Unknown SOAP fault';
		throw new Error(`Workday SOAP Error: ${JSON.stringify(faultString)}`);
	}

	return soapBody ?? parsed;
}

export function escapeWql(value: string): string {
	return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function getApiHost(auth: OAuth2PropertyValue): string {
	return getHost(auth);
}

export async function workdayWqlRequestAll(
	auth: OAuth2PropertyValue,
	query: string,
): Promise<Record<string, unknown>[]> {
	const allRows: Record<string, unknown>[] = [];
	const limit = 1000;
	let offset = 0;

	while (true) {
		const response = await workdayWqlRequest<{
			data?: Record<string, unknown>[];
			total?: number;
		}>(auth, query, limit, offset);
		const rows = response.body.data ?? [];
		allRows.push(...rows);

		// A short page is the only reliable end-of-data signal. `total` is used to
		// stop one round-trip early, but ONLY when the API actually returns it —
		// falling back to allRows.length would halt after the first full page.
		if (rows.length < limit) {
			break;
		}
		offset += limit;
		const total = response.body.total;
		if (typeof total === 'number' && offset >= total) {
			break;
		}
	}

	return allRows;
}

export async function workdayBusinessProcessTransactions({
	auth,
	momentField,
	sinceEpochMS,
	typeIds,
	completedOnly,
}: {
	auth: OAuth2PropertyValue;
	momentField: 'dateAndTimeInitiated' | 'dateAndTimeCompleted';
	sinceEpochMS: number;
	typeIds?: string[];
	completedOnly?: boolean;
}): Promise<Record<string, unknown>[]> {
	const conditions = [`${momentField} > '${new Date(sinceEpochMS).toISOString()}'`];
	if (typeIds && typeIds.length > 0) {
		conditions.push(`businessProcessType in (${typeIds.map((id) => `'${escapeWql(id)}'`).join(', ')})`);
	}
	if (completedOnly) {
		conditions.push(`status = 'Successfully Completed'`);
	}
	const limit = sinceEpochMS === 0 ? ' LIMIT 10' : '';
	return workdayWqlRequestAll(
		auth,
		`SELECT businessProcessEvent, businessProcessType, status, worker, subject, dateAndTimeInitiated, dateAndTimeCompleted FROM businessProcessTransactions WHERE ${conditions.join(' AND ')} ORDER BY ${momentField} DESC${limit}`,
	);
}

export async function workdayGetReport({
	auth,
	report,
	parameters,
	format = 'json',
}: {
	auth: OAuth2PropertyValue;
	report: string;
	parameters?: Record<string, unknown>;
	format?: 'json' | 'csv';
}): Promise<WorkdayReport> {
	const { owner, name, urlParameters } = parseReportReference({ auth, report });
	const reportPath = `${owner}/${name}`;
	const response = await httpClient.sendRequest<unknown>({
		method: HttpMethod.GET,
		url: `https://${getHost(auth)}/ccx/service/customreport2/${encodeURIComponent(getTenant(auth))}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
		queryParams: { ...urlParameters, ...toPromptValues(parameters), format },
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: auth.access_token,
		},
	});
	if (format === 'csv') {
		return { reportPath, format, csv: typeof response.body === 'string' ? response.body : '' };
	}
	return { reportPath, format, rows: readReportEntries(response.body) };
}

function parseReportReference({
	auth,
	report,
}: {
	auth: OAuth2PropertyValue;
	report: string;
}): { owner: string; name: string; urlParameters: Record<string, string> } {
	const value = report.trim();
	if (!/^https?:\/\//i.test(value)) {
		const parts = value.split('/');
		if (parts.length !== 2 || !parts[0] || !parts[1]) {
			throw new Error('Enter the report as `owner/report_name` (e.g. `lmcneil/PT_Workers`) or paste its RaaS URL.');
		}
		return { owner: parts[0], name: parts[1], urlParameters: {} };
	}
	const url = new URL(value);
	const host = getHost(auth);
	if (url.hostname.toLowerCase() !== host.toLowerCase()) {
		throw new Error(`The report URL host "${url.hostname}" does not match the connection's API host "${host}".`);
	}
	const match = /^\/ccx\/service\/customreport2\/([^/]+)\/([^/]+)\/([^/]+)\/?$/.exec(url.pathname);
	if (!match) {
		throw new Error('The URL is not a Workday RaaS URL (expected /ccx/service/customreport2/{tenant}/{owner}/{report}).');
	}
	const tenant = getTenant(auth);
	if (decodeURIComponent(match[1]) !== tenant) {
		throw new Error(`The report URL tenant "${decodeURIComponent(match[1])}" does not match the connection's tenant "${tenant}".`);
	}
	const urlParameters = Object.fromEntries(
		[...url.searchParams.entries()].filter(([key]) => key !== 'format'),
	);
	return {
		owner: decodeURIComponent(match[2]),
		name: decodeURIComponent(match[3]),
		urlParameters,
	};
}

function toPromptValues(parameters: Record<string, unknown> | undefined): Record<string, string> {
	if (!parameters) {
		return {};
	}
	return Object.fromEntries(
		Object.entries(parameters)
			.filter(([, value]) => value !== undefined && value !== null)
			.map(([key, value]) => [key, Array.isArray(value) ? value.map(String).join('!') : String(value)]),
	);
}

function readReportEntries(body: unknown): Record<string, unknown>[] {
	if (typeof body !== 'object' || body === null || !('Report_Entry' in body)) {
		return [];
	}
	const entries = body.Report_Entry;
	const list = Array.isArray(entries) ? entries : [entries];
	return list.filter(
		(entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null,
	);
}

export async function workdayListCustomObjectDefinitions(
	auth: OAuth2PropertyValue,
): Promise<Record<string, unknown>[]> {
	return fetchAllPages<Record<string, unknown>>(
		auth,
		'/definitions',
		undefined,
		'data',
		WorkdayService.customObjectDefinition,
	);
}

export async function workdayGetCustomObject({
	auth,
	alias,
	objectId,
}: {
	auth: OAuth2PropertyValue;
	alias: string;
	objectId: string;
}): Promise<Record<string, unknown>> {
	const response = await workdayRequest<Record<string, unknown>>(
		auth,
		HttpMethod.GET,
		`/customObjects/${encodeURIComponent(alias)}/${encodeURIComponent(objectId)}`,
	);
	return response.body;
}

export async function workdayUpsertCustomObject({
	auth,
	alias,
	objectId,
	body,
}: {
	auth: OAuth2PropertyValue;
	alias: string;
	objectId?: string;
	body: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
	const path = `/customObjects/${encodeURIComponent(alias)}`;
	const response = objectId
		? await workdayRequest<Record<string, unknown>>(auth, HttpMethod.PUT, `${path}/${encodeURIComponent(objectId)}`, body)
		: await workdayRequest<Record<string, unknown>>(auth, HttpMethod.POST, path, body, { updateIfExists: 'true' });
	return response.body;
}

export type WorkdayReport =
	| { reportPath: string; format: 'json'; rows: Record<string, unknown>[] }
	| { reportPath: string; format: 'csv'; csv: string };
