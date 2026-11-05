import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function listNetworks({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/networks', query });
}

async function createNetwork({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/networks',
		body,
	});
}

async function getNetwork({
	auth,
	networkId,
}: {
	auth: TelnyxAuthValue;
	networkId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/networks/${encodeURIComponent(networkId)}`,
	});
}

async function updateNetwork({
	auth,
	networkId,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	networkId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `/networks/${encodeURIComponent(networkId)}`,
		body,
	});
}

async function deleteNetwork({
	auth,
	networkId,
}: {
	auth: TelnyxAuthValue;
	networkId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: `/networks/${encodeURIComponent(networkId)}`,
	});
}

async function listNetworkInterfaces({
	auth,
	networkId,
	query,
}: QueryOnlyParams & {
	auth: TelnyxAuthValue;
	networkId: string;
}): Promise<TelnyxPage> {
	return await requestPage({
		auth,
		path: `/networks/${encodeURIComponent(networkId)}/network_interfaces`,
		query,
	});
}

async function listDynamicEmergencyEndpoints({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/dynamic_emergency_endpoints', query });
}

async function getDynamicEmergencyEndpoint({
	auth,
	endpointId,
}: {
	auth: TelnyxAuthValue;
	endpointId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/dynamic_emergency_endpoints/${encodeURIComponent(endpointId)}`,
	});
}

async function listMobileNetworkOperators({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/mobile_network_operators', query });
}

async function listGlobalIpHealthCheckTypes({
	auth,
}: {
	auth: TelnyxAuthValue;
}): Promise<TelnyxRecord[]> {
	const response = await requestPage({
		auth,
		path: '/global_ip_health_check_types',
		query: {},
	});
	return response.data ?? [];
}

async function getBlackBoxTestResults({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord[]> {
	const response = await requestPage({
		auth,
		path: '/seti/black_box_test_results',
		query,
	});
	return response.data ?? [];
}

async function requestData({
	auth,
	method,
	path,
	body,
}: {
	auth: TelnyxAuthValue;
	method: HttpMethod;
	path: string;
	body?: Record<string, unknown>;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method,
		path,
		body,
	});
	return response.data;
}

async function requestPage({
	auth,
	path,
	query,
}: QueryOnlyParams & {
	auth: TelnyxAuthValue;
	path: string;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path,
		query,
	});
}

export const telnyxNetworkingApi = {
	listNetworks,
	createNetwork,
	getNetwork,
	updateNetwork,
	deleteNetwork,
	listNetworkInterfaces,
	listDynamicEmergencyEndpoints,
	getDynamicEmergencyEndpoint,
	listMobileNetworkOperators,
	listGlobalIpHealthCheckTypes,
	getBlackBoxTestResults,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
