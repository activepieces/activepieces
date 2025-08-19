import {
	AuthenticationType,
	httpClient,
	HttpError,
	HttpMessageBody,
	HttpMethod,
	HttpRequest,
} from '@activepieces/pieces-common';
import { GetField, PaginatedV2Response, PaginatedV1Response, RequestParams } from './types';
import { isEmpty, isNil } from '@activepieces/shared';
import dayjs from 'dayjs';

type FlexibleQueryParams = Record<
	string,
	string | number | boolean | string[] | number[] | null | undefined
>;

export const pipedriveCommon = {
	subscribeWebhook: async (
		object: string,
		action: string,
		webhookUrl: string,
		apiDomain: string,
		accessToken: string,
	) => {
		const request: HttpRequest = {
			method: HttpMethod.POST,
			url: `${apiDomain}/api/v1/webhooks`,
			body: {
				event_object: object,
				event_action: action,
				subscription_url: webhookUrl,
				version: '2.0',
			},
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
			queryParams: {},
		};

		const { body: webhook } = await httpClient.sendRequest<{
			data: { id: string };
		}>(request);
		return webhook;
	},

	unsubscribeWebhook: async (webhookId: string, apiDomain: string, accessToken: string) => {
		const request: HttpRequest = {
			method: HttpMethod.DELETE,
			url: `${apiDomain}/api/v1/webhooks/${webhookId}`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: accessToken,
			},
		};
		return await httpClient.sendRequest(request);
	},
};

export type PipedriveApiCallParams = {
	accessToken: string;
	apiDomain: string;
	method: HttpMethod;
	resourceUri: string;
	query?: RequestParams;
	body?: any;
};

export async function pipedriveApiCall<T extends HttpMessageBody>({
	accessToken,
	apiDomain,
	method,
	resourceUri,
	query,
	body,
}: PipedriveApiCallParams): Promise<T> {
	const url = `${apiDomain}/api${resourceUri}`;

	const qs: Record<string, string> = {};
	if (query) {
		for (const [key, value] of Object.entries(query)) {
			if (value !== null && value !== undefined) {
				qs[key] = Array.isArray(value) ? value.map(String).join(',') : String(value);
			}
		}
	}

	let requestBody: any;
	if (body) {
		requestBody = Object.entries(body).reduce((acc, [key, value]) => {
			if (!isNil(value)) {
				acc[key] = value;
			}
			return acc;
		}, {} as Record<string, any>);
	}

	const request: HttpRequest = {
		method,
		url,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: accessToken,
		},
		queryParams: qs,
		body: requestBody,
	};

	try {
		const response = await httpClient.sendRequest<T>(request);
		return response.body;
	} catch (error) {
		if (error instanceof HttpError) {
			if (error.response.status === 403) {
				throw new Error('Please reconnect your Pipedrive account.');
			}
		}
		throw error;
	}
}

export async function pipedrivePaginatedV1ApiCall<T extends HttpMessageBody>({
	accessToken,
	apiDomain,
	method,
	resourceUri,
	query,
	body,
}: PipedriveApiCallParams): Promise<T[]> {
	const qs = query ? query : {};

	qs.start = 0;
	qs.limit = 500;

	const resultData: T[] = [];
	let hasMoreItems = true;

	do {
		const response = await pipedriveApiCall<PaginatedV1Response<T>>({
			accessToken,
			apiDomain,
			method,
			resourceUri,
			query: qs,
			body,
		});

		if (isNil(response.data)) {
			break;
		}

		resultData.push(...response.data);
		qs.start = response.additional_data.pagination.next_start;
		hasMoreItems = response.additional_data.pagination.more_items_in_collection;
	} while (hasMoreItems);

	return resultData;
}

export async function pipedrivePaginatedV2ApiCall<T extends HttpMessageBody>({
	accessToken,
	apiDomain,
	method,
	resourceUri,
	query,
	body,
}: PipedriveApiCallParams): Promise<T[]> {
	const qs: FlexibleQueryParams = query ? { ...query } : {};

	let cursor: string | undefined = undefined;
	const resultData: T[] = [];
	let hasMoreItems = true;


	do {
		const currentQuery: FlexibleQueryParams = { ...qs };
		if (cursor) {
			currentQuery.cursor = cursor;
		}
		currentQuery.limit = 500;

		const response = await pipedriveApiCall<PaginatedV2Response<T>>({
			accessToken,
			apiDomain,
			method,
			resourceUri,
			query: currentQuery as RequestParams,
			body,
		});


		if (isNil(response.data)) {
			break;
		}

		if (Array.isArray(response.data)) {
			resultData.push(...response.data);
		} else {
			resultData.push(response.data);
		}

		hasMoreItems = response.additional_data?.next_cursor != null;
		cursor = response.additional_data?.next_cursor;
	} while (hasMoreItems && cursor);

	return resultData;
}

function formatDateIfValid(val: any) {
	return dayjs(val).isValid() ? dayjs(val).format('YYYY-MM-DD') : val;
}

export function pipedriveParseCustomFields(
	customFieldsDefinitions: GetField[],
	inputData: Record<string, any>,
): Record<string, any> {
	const fieldTypeMap: Record<string, GetField> = customFieldsDefinitions.reduce((acc, field) => {
		acc[field.key] = field;
		return acc;
	}, {} as Record<string, GetField>);

	const parsedFields: Record<string, any> = {};

	for (const [key, value] of Object.entries(inputData)) {
		if (isEmpty(value)) continue;

		const matchedField = fieldTypeMap[key];
		if (!matchedField) continue;

		// https://pipedrive.readme.io/docs/pipedrive-api-v2-migration-guide#custom-fields
		if (matchedField.is_subfield) {
			const parentField = key.split('_')[0];
			parsedFields[parentField] = {
				...parsedFields[parentField],
				[matchedField.id_suffix]: matchedField.field_type === "date" ? formatDateIfValid(value) : value,
			};
			continue;
		}

		switch (matchedField.field_type) {
			case 'monetary':
				parsedFields[key] = { ...parsedFields[key], value: Number(value) };
				break;
			case 'address':
			case 'daterange':
			case 'timerange':
            case 'time':
				parsedFields[key] = { ...parsedFields[key], value: formatDateIfValid(value) };
				break;
			case 'date':
				parsedFields[key] = formatDateIfValid(value);
				break;
			default:
				parsedFields[key] = value;
				break;
		}
	}

	return parsedFields;
}

export function pipedriveTransformCustomFields(
	customFieldsDefinitions: GetField[],
	responseData: Record<string, any>,
): Record<string, any> {
	const updatedResponseData = { ...responseData };

	const rawCustomFields = responseData.custom_fields || {};

	for (const field of customFieldsDefinitions) {
		if (!field.edit_flag) {
			continue;
		}

		const oldKey = field.key;
		const newKey = field.name;
		const fieldType = field.field_type;

		if (oldKey in rawCustomFields) {
			const value = rawCustomFields[oldKey];

			if (isNil(value)) {
				updatedResponseData[newKey] = null;
			} else if (fieldType === 'enum') {
				updatedResponseData[newKey] =
					field.options?.find((option) => option.id === value)?.label || null;
			} else if (fieldType === 'set') {
				if (Array.isArray(value)) {
					updatedResponseData[newKey] = value.map(
						(item) => field.options?.find((option) => option.id === item)?.label || null,
					);
				} else {
					updatedResponseData[newKey] = value;
				}
			} else {
				updatedResponseData[newKey] = value;
			}
		}
	}

	delete updatedResponseData.custom_fields;

	return updatedResponseData;
}


export function pipedriveTransformV1CustomFields(
	CustomFields: GetField[],
	responseData: Record<string, any>,
): Record<string, any> {
	const updatedResponseData = { ...responseData };

	for (const field of CustomFields) {
		if (!field.edit_flag) {
			continue;
		}
		const oldKey = field.key;
		const newKey = field.name;
		const fieldType = field.field_type;

		if (oldKey in responseData) {
			if (responseData[oldKey] === null || responseData[oldKey] === undefined) {
				updatedResponseData[newKey] = null;
			} else if (fieldType === 'enum') {
				updatedResponseData[newKey] =
					field.options?.find((option) => option.id.toString() === responseData[oldKey])?.label ||
					null;
			} else if (fieldType === 'set') {
				const values: string[] = responseData[oldKey].split(',');
				updatedResponseData[newKey] = values.map(
					(item) => field.options?.find((option) => option.id.toString() === item)?.label || null,
				);
			} else {
				updatedResponseData[newKey] = responseData[oldKey];
			}
			delete updatedResponseData[oldKey];
		}
	}
	return updatedResponseData;
}