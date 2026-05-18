import {
	AuthenticationType,
	httpClient,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
	QueryParams,
} from '@activepieces/pieces-common';
import crypto from 'crypto';
import { AttioAttributeValue, AttioRecordResponse, WorkspaceMemberResponse } from './types';

export const BASE_URL = 'https://api.attio.com/v2';

export type AttioApiCallParams = {
	accessToken: string;
	method: HttpMethod;
	resourceUri: string;
	query?: Record<string, string | number | string[] | undefined>;
	body?: any;
};

export async function attioApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: AttioApiCallParams): Promise<T> {
	const qs: QueryParams = {};

	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = String(value);
			}
		}
	}

	const request: HttpRequest = {
		method,
		url: BASE_URL + resourceUri,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		queryParams: qs,
		body,
	};

	const response = await httpClient.sendRequest<T>(request);
	return response.body;
}

export async function attioPaginatedApiCall<T extends HttpMessageBody>({
	accessToken,
	method,
	resourceUri,
	query,
	body,
}: AttioApiCallParams): Promise<T[]> {
	const limit = 500;
	let offset = 0;

	const resultData: T[] = [];
	let hasMoreItems = true;

	do {
		const qs = {
			...(query || {}),
			limit,
			offset,
		};

		const response = await attioApiCall<{ data: T[] }>({
			accessToken,
			method,
			resourceUri,
			query: qs,
			body,
		});

		if (!response?.data || response.data.length === 0) {
			break;
		}

		resultData.push(...response.data);

		// If fewer than 'limit' items returned, we've reached the last page
		hasMoreItems = response.data.length === limit;
		offset += limit;
	} while (hasMoreItems);

	return resultData;
}

export async function buildMembersMap(
	accessToken: string,
	records: AttioRecordResponse[],
): Promise<Record<string, WorkspaceMemberResponse>> {
	const actorIds = new Set<string>();
	for (const record of records) {
		for (const valueArray of Object.values(record.values)) {
			for (const item of valueArray) {
				if (item.attribute_type === 'actor-reference' && item.referenced_actor_type === 'workspace-member' && item.referenced_actor_id) {
					actorIds.add(item.referenced_actor_id);
				}
			}
		}
	}

	if (actorIds.size === 0) return {};

	const members = await Promise.all(
		[...actorIds].map((id) =>
			attioApiCall<{ data: WorkspaceMemberResponse }>({
				accessToken,
				method: HttpMethod.GET,
				resourceUri: `/workspace_members/${id}`,
			}).then((res) => res.data),
		),
	);

	return Object.fromEntries(members.map((m) => [m.id.workspace_member_id, m]));
}

function extractAttributeValue(
	item: AttioAttributeValue,
	membersMap: Record<string, WorkspaceMemberResponse>,
): unknown {
	switch (item.attribute_type) {
		case 'text':
		case 'number':
		case 'checkbox':
		case 'rating':
		case 'date':
		case 'timestamp':
			return item.value ?? null;
		case 'currency':
			return { value: item.currency_value, currency_code: item.currency_code };
		case 'email-address':
			return item.email_address;
		case 'personal-name':
			return item.full_name;
		case 'phone-number':
			return item.phone_number;
		case 'domain':
			return item.domain;
		case 'location': {
			const loc: Partial<typeof item> = {};
			for (const field of [
				'line_1', 'line_2', 'line_3', 'line_4',
				'locality', 'region', 'postcode', 'country_code',
				'latitude', 'longitude',
			] as const) {
				if (item[field] !== null && item[field] !== undefined) {
					loc[field] = item[field];
				}
			}
			return Object.keys(loc).length > 0 ? loc : null;
		}
		case 'select':
			return item.option?.title ?? null;
		case 'status':
			return item.status?.title ?? null;
		case 'record-reference':
			return item.target_record_id;
		case 'actor-reference':
			return item.referenced_actor_id
				? (membersMap[item.referenced_actor_id] ?? item.referenced_actor_id)
				: null;
		case 'interaction':
			return item.interacted_at;
	}
}

export function normalizeRecord(
	record: AttioRecordResponse,
	membersMap: Record<string, WorkspaceMemberResponse>,
): Record<string, unknown> {
	const flatValues: Record<string, unknown> = {};

	for (const [key, valueArray] of Object.entries(record.values)) {
		if (valueArray.length === 0) {
			flatValues[key] = null;
			continue;
		}
		const extracted = valueArray
			.map((item) => extractAttributeValue(item, membersMap))
			.filter((v) => v !== null && v !== undefined);
		flatValues[key] =
			extracted.length === 0 ? null : extracted.length === 1 ? extracted[0] : extracted;
	}

	return { ...record, values: flatValues };
}

export function verifyWebhookSignature(
	webhookSecret?: string,
	webhookSignatureHeader?: string,
	webhookRawBody?: any,
): boolean {
	if (!webhookSecret || !webhookSignatureHeader || !webhookRawBody) {
		return false;
	}

	try {
		const hmac = crypto.createHmac('sha256', webhookSecret);
		hmac.update(webhookRawBody);
		const expectedSignature = hmac.digest('hex');

		return crypto.timingSafeEqual(
			Buffer.from(webhookSignatureHeader, 'hex'),
			Buffer.from(expectedSignature, 'hex'),
		);
	} catch (error) {
		return false;
	}
}
