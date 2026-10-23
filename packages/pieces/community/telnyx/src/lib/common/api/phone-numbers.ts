import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function requestData({
	auth,
	method,
	path,
	query,
	body,
}: DataRequestParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method,
		path,
		query,
		body,
	});
	return response.data;
}

function numberPath({ phoneNumberId }: { phoneNumberId: string }): string {
	return `/phone_numbers/${encodeURIComponent(phoneNumberId)}`;
}

async function listPhoneNumbersPage({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/phone_numbers',
		query,
	});
}

async function getPhoneNumber({
	auth,
	phoneNumberId,
}: NumberParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: numberPath({ phoneNumberId }),
	});
}

async function updatePhoneNumber({
	auth,
	phoneNumberId,
	body,
}: NumberParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: numberPath({ phoneNumberId }),
		body,
	});
}

async function releasePhoneNumber({
	auth,
	phoneNumberId,
}: NumberParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: numberPath({ phoneNumberId }),
	});
}

async function getPhoneNumberMessagingSettings({
	auth,
	phoneNumberId,
}: NumberParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `${numberPath({ phoneNumberId })}/messaging`,
	});
}

async function updatePhoneNumberMessagingSettings({
	auth,
	phoneNumberId,
	body,
}: NumberParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `${numberPath({ phoneNumberId })}/messaging`,
		body,
	});
}

async function getPhoneNumberVoiceSettings({
	auth,
	phoneNumberId,
}: NumberParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `${numberPath({ phoneNumberId })}/voice`,
	});
}

async function updatePhoneNumberVoiceSettings({
	auth,
	phoneNumberId,
	body,
}: NumberParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `${numberPath({ phoneNumberId })}/voice`,
		body,
	});
}

async function getVoicemailSettings({
	auth,
	phoneNumberId,
}: NumberParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `${numberPath({ phoneNumberId })}/voicemail`,
	});
}

async function createVoicemailSettings({
	auth,
	phoneNumberId,
	body,
}: NumberParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: `${numberPath({ phoneNumberId })}/voicemail`,
		body,
	});
}

async function updateVoicemailSettings({
	auth,
	phoneNumberId,
	body,
}: NumberParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `${numberPath({ phoneNumberId })}/voicemail`,
		body,
	});
}

async function searchAvailablePhoneNumbers({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/available_phone_numbers',
		query,
	});
}

async function listNumberOrders({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/number_orders',
		query,
	});
}

async function createNumberOrder({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/number_orders',
		body,
	});
}

async function getNumberOrder({
	auth,
	numberOrderId,
}: OrderParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/number_orders/${encodeURIComponent(numberOrderId)}`,
	});
}

async function updateNumberOrder({
	auth,
	numberOrderId,
	body,
}: OrderParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `/number_orders/${encodeURIComponent(numberOrderId)}`,
		body,
	});
}

async function lookupPhoneNumber({
	auth,
	phoneNumber,
	query,
}: QueryOnlyParams & { phoneNumber: string; auth: TelnyxAuthValue }): Promise<
	TelnyxRecord | undefined
> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/number_lookup/${encodeURIComponent(phoneNumber)}`,
		query,
	});
}

export const telnyxPhoneNumbersApi = {
	listPhoneNumbersPage,
	getPhoneNumber,
	updatePhoneNumber,
	releasePhoneNumber,
	getPhoneNumberMessagingSettings,
	updatePhoneNumberMessagingSettings,
	getPhoneNumberVoiceSettings,
	updatePhoneNumberVoiceSettings,
	getVoicemailSettings,
	createVoicemailSettings,
	updateVoicemailSettings,
	searchAvailablePhoneNumbers,
	listNumberOrders,
	createNumberOrder,
	getNumberOrder,
	updateNumberOrder,
	lookupPhoneNumber,
};

type DataRequestParams = {
	method: HttpMethod;
	path: string;
	query?: QueryParams;
	body?: Record<string, unknown>;
};
type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
type NumberParams = { phoneNumberId: string };
type OrderParams = { numberOrderId: string };
