import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function listConnections({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/connections',
		query,
	});
}

async function getConnection({
	auth,
	connectionId,
}: {
	auth: TelnyxAuthValue;
	connectionId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/connections/${encodeURIComponent(connectionId)}`,
	});
	return response.data;
}

async function listActiveCalls({
	auth,
	connectionId,
	query,
}: QueryOnlyParams & {
	auth: TelnyxAuthValue;
	connectionId: string;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `/connections/${encodeURIComponent(connectionId)}/active_calls`,
		query,
	});
}

async function listOutboundVoiceProfiles({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/outbound_voice_profiles',
		query,
	});
}

async function listFaxApplications({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/fax_applications',
		query,
	});
}

async function listCallControlApplications({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/call_control_applications',
		query,
	});
}

async function createCallControlApplication({
	auth,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
}): Promise<TelnyxCallControlApplication | undefined> {
	const response = await telnyxClient.request<{
		data?: TelnyxCallControlApplication;
	}>({
		auth,
		method: HttpMethod.POST,
		path: '/call_control_applications',
		body,
	});
	return response.data;
}

async function getCallControlApplication({
	auth,
	applicationId,
}: {
	auth: TelnyxAuthValue;
	applicationId: string;
}): Promise<TelnyxCallControlApplication | undefined> {
	const response = await telnyxClient.request<{
		data?: TelnyxCallControlApplication;
	}>({
		auth,
		method: HttpMethod.GET,
		path: `/call_control_applications/${encodeURIComponent(applicationId)}`,
	});
	return response.data;
}

async function updateCallControlApplication({
	auth,
	applicationId,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	applicationId: string;
}): Promise<TelnyxCallControlApplication | undefined> {
	const response = await telnyxClient.request<{
		data?: TelnyxCallControlApplication;
	}>({
		auth,
		method: HttpMethod.PATCH,
		path: `/call_control_applications/${encodeURIComponent(applicationId)}`,
		body,
	});
	return response.data;
}

async function deleteCallControlApplication({
	auth,
	applicationId,
}: {
	auth: TelnyxAuthValue;
	applicationId: string;
}): Promise<TelnyxCallControlApplication | undefined> {
	const response = await telnyxClient.request<{
		data?: TelnyxCallControlApplication;
	}>({
		auth,
		method: HttpMethod.DELETE,
		path: `/call_control_applications/${encodeURIComponent(applicationId)}`,
	});
	return response.data;
}

export const telnyxConnectionsApi = {
	listConnections,
	getConnection,
	listActiveCalls,
	listOutboundVoiceProfiles,
	listFaxApplications,
	listCallControlApplications,
	createCallControlApplication,
	getCallControlApplication,
	updateCallControlApplication,
	deleteCallControlApplication,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
type TelnyxCallControlApplication = {
	id?: string;
	application_name?: string;
	webhook_event_url?: string;
	outbound?: Record<string, unknown>;
	[key: string]: unknown;
};
