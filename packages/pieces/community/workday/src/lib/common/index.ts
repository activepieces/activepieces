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
	resourceManagement: 'resourceManagement/v3',
	expenseManagement: 'expenseManagement/v1',
	inbox: 'inbox/v1',
	leaveManagement: 'absenceManagement/v1',
	timeTracking: 'time/v2',
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
): Promise<HttpResponse<T>> {
	if (!auth || !auth.access_token) {
		throw new Error('Workday connection is not configured. Please select a valid Workday connection.');
	}
	const tenant = getTenant(auth);
	return httpClient.sendRequest<T>({
		method: HttpMethod.POST,
		url: `https://${getHost(auth)}/ccx/api/${WQL_BASE}/${tenant}/data`,
		body: { query },
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

		const total =
			typeof response.body['total'] === 'number'
				? response.body['total']
				: allItems.length;
		offset += limit;
		hasMore = offset < total && items.length === limit;
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
	return value.replace(/'/g, "''");
}
