import { XMLParser } from 'fast-xml-parser';

import {
	AuthenticationType,
	HttpMethod,
	HttpRequest,
	QueryParams,
	httpClient,
} from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';

import { workdayUtils } from './utils';

import type { WorkdayAuthValue, WorkdayPage, WorkdayRecord, WorkdaySoapEnvelope } from './types';

function apiHost({ auth }: { auth: WorkdayAuthValue }): string {
	return readConnectionProp({ auth, key: 'apiHost' }) ?? '';
}

function tenant({ auth }: { auth: WorkdayAuthValue }): string {
	return readConnectionProp({ auth, key: 'tenant' }) ?? '';
}

function baseUrl({ auth, service = 'v1' }: { auth: WorkdayAuthValue; service?: string }): string {
	return `https://${apiHost({ auth })}/ccx/api/${service}/${tenant({ auth })}`;
}

function bearerToken({ auth }: { auth: WorkdayAuthValue }): string {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		throw new Error(
			"This action uses Workday's REST API, which needs the OAuth 2.0 connection. Select a Workday OAuth 2.0 connection for this step.",
		);
	}
	return auth.access_token;
}

async function request<T>({
	auth,
	method,
	path,
	query,
	body,
	service,
}: RequestParams & { auth: WorkdayAuthValue }): Promise<T> {
	const response = await httpClient.sendRequest<T>({
		method,
		url: `${baseUrl({ auth, service })}${path}`,
		body,
		queryParams: query,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: bearerToken({ auth }),
		},
	});
	return response.body;
}

async function paginate<T>({
	auth,
	path,
	query,
	service,
}: PaginateParams & { auth: WorkdayAuthValue }): Promise<T[]> {
	const allItems: T[] = [];
	let offset = 0;
	let hasMore = true;

	while (hasMore) {
		const page = await request<WorkdayPage<T>>({
			auth,
			method: HttpMethod.GET,
			path,
			query: { ...query, limit: String(REST_PAGE_SIZE), offset: String(offset) },
			service,
		});

		const items = page.data ?? [];
		allItems.push(...items);
		offset += REST_PAGE_SIZE;

		if (items.length < REST_PAGE_SIZE) {
			hasMore = false;
		} else {
			hasMore = typeof page.total !== 'number' || offset < page.total;
		}
	}

	return allItems;
}

async function wql<T>({
	auth,
	query,
	limit,
	offset,
}: WqlParams & { auth: WorkdayAuthValue }): Promise<T> {
	const token = bearerToken({ auth });
	const queryParams: QueryParams = {};
	if (limit !== undefined) queryParams['limit'] = String(limit);
	if (offset !== undefined) queryParams['offset'] = String(offset);
	const response = await httpClient.sendRequest<T>({
		method: HttpMethod.POST,
		url: `https://${apiHost({ auth })}/ccx/api/wql/v1/${tenant({ auth })}/data`,
		body: { query },
		queryParams,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token,
		},
	});
	return response.body;
}

async function wqlAll<T>({ auth, query }: { auth: WorkdayAuthValue; query: string }): Promise<T[]> {
	const allRows: T[] = [];
	let offset = 0;

	while (true) {
		const page = await wql<WorkdayPage<T>>({ auth, query, limit: WQL_PAGE_SIZE, offset });
		const rows = page.data ?? [];
		allRows.push(...rows);

		if (rows.length < WQL_PAGE_SIZE) {
			break;
		}
		offset += WQL_PAGE_SIZE;
		if (typeof page.total === 'number' && offset >= page.total) {
			break;
		}
	}

	return allRows;
}

async function soap<T extends WorkdayRecord = WorkdayRecord>({
	auth,
	service,
	operationXml,
	version,
}: SoapParams & { auth: WorkdayAuthValue }): Promise<T> {
	const { username, password } = isuCredentials({ auth });
	const envelope = buildSoapEnvelope({
		username: username.includes('@') ? username : `${username}@${tenant({ auth })}`,
		password,
		operationXml,
	});

	const response = await httpClient.sendRequest({
		method: HttpMethod.POST,
		url: `https://${apiHost({ auth })}/ccx/service/${tenant({
			auth,
		})}/${service}/${wwsVersion({
			auth,
			version,
		})}`,
		headers: {
			'Content-Type': 'text/xml;charset=UTF-8',
		},
		body: envelope,
	});

	const parser = new XMLParser({
		ignoreAttributes: false,
		removeNSPrefix: true,
		parseAttributeValue: true,
		numberParseOptions: { leadingZeros: false, hex: false },
	});

	const parsed: WorkdaySoapEnvelope<T> = parser.parse(
		typeof response.body === 'string' ? response.body : JSON.stringify(response.body),
	);
	const soapBody = parsed.Envelope?.Body;

	if (soapBody?.Fault) {
		const faultString = soapBody.Fault.faultstring ?? soapBody.Fault.Reason ?? 'Unknown SOAP fault';
		throw new Error(`Workday SOAP Error: ${JSON.stringify(faultString)}`);
	}
	if (!soapBody) {
		throw new Error('Workday returned a response without a SOAP body.');
	}

	return soapBody;
}

async function report({
	auth,
	owner,
	name,
	query,
}: ReportParams & { auth: WorkdayAuthValue }): Promise<unknown> {
	const response = await httpClient.sendRequest<unknown>({
		method: HttpMethod.GET,
		url: `https://${apiHost({ auth })}/ccx/service/customreport2/${encodeURIComponent(
			tenant({ auth }),
		)}/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
		queryParams: query,
		authentication: reportAuthentication({ auth }),
	});
	return response.body;
}

function readConnectionProp({
	auth,
	key,
}: {
	auth: WorkdayAuthValue;
	key: 'apiHost' | 'tenant' | 'wwsVersion' | 'isuUsername' | 'isuPassword';
}): string | undefined {
	const props: Record<string, unknown> | undefined = auth.props;
	const value = props?.[key];
	return typeof value === 'string' ? value : undefined;
}

function wwsVersion({
	auth,
	version: override,
}: {
	auth: WorkdayAuthValue;
	version?: string;
}): string {
	const version =
		override?.trim() ||
		readConnectionProp({ auth, key: 'wwsVersion' })?.trim() ||
		DEFAULT_WWS_VERSION;
	if (!/^v\d+(\.\d+)?$/.test(version)) {
		throw new Error(`WWS Version "${version}" is not valid. Use a version like v47.0.`);
	}
	return version;
}

function isuCredentials({ auth }: { auth: WorkdayAuthValue }): {
	username: string;
	password: string;
} {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		return { username: auth.props.username.trim(), password: auth.props.password };
	}
	const username = readConnectionProp({ auth, key: 'isuUsername' })?.trim();
	const password = readConnectionProp({ auth, key: 'isuPassword' });
	if (!username || !password) {
		throw new Error(
			'ISU Username and Password are required for write operations. Please update your Workday connection with Integration System User credentials.',
		);
	}
	return { username, password };
}

function reportAuthentication({ auth }: { auth: WorkdayAuthValue }): HttpRequest['authentication'] {
	if (auth.type === AppConnectionType.CUSTOM_AUTH) {
		return {
			type: AuthenticationType.BASIC,
			username: auth.props.username.trim().split('@')[0],
			password: auth.props.password,
		};
	}
	return { type: AuthenticationType.BEARER_TOKEN, token: auth.access_token };
}

function buildSoapEnvelope({
	username,
	password,
	operationXml,
}: {
	username: string;
	password: string;
	operationXml: string;
}): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:bsvc="urn:com.workday/bsvc">
  <soapenv:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" soapenv:mustUnderstand="1">
      <wsse:UsernameToken>
        <wsse:Username>${workdayUtils.escapeXml({ value: username })}</wsse:Username>
        <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">${workdayUtils.escapeXml(
					{ value: password },
				)}</wsse:Password>
      </wsse:UsernameToken>
    </wsse:Security>
  </soapenv:Header>
  <soapenv:Body>
    ${operationXml}
  </soapenv:Body>
</soapenv:Envelope>`;
}

export const workdayClient = {
	apiHost,
	tenant,
	baseUrl,
	bearerToken,
	request,
	paginate,
	wql,
	wqlAll,
	soap,
	report,
};

const DEFAULT_WWS_VERSION = 'v47.0';
const REST_PAGE_SIZE = 100;
const WQL_PAGE_SIZE = 1000;

type RequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: unknown;
	service?: string;
};

type PaginateParams = {
	path: string;
	query?: QueryParams;
	service?: string;
};

type WqlParams = {
	query: string;
	limit?: number;
	offset?: number;
};

type SoapParams = {
	service: string;
	operationXml: string;
	version?: string;
};

type ReportParams = {
	owner: string;
	name: string;
	query: QueryParams;
};
