import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function getBalance({ auth }: { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({ auth, method: HttpMethod.GET, path: '/balance' });
}

async function listAuditEvents({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/audit_events', query });
}

async function listAuthenticationProviders({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/authentication_providers', query });
}

async function listNotificationChannels({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/notification_channels', query });
}

async function createNotificationChannel({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/notification_channels',
		body,
	});
}

async function getNotificationChannel({
	auth,
	channelId,
}: {
	auth: TelnyxAuthValue;
	channelId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/notification_channels/${encodeURIComponent(channelId)}`,
	});
}

async function updateNotificationChannel({
	auth,
	channelId,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	channelId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `/notification_channels/${encodeURIComponent(channelId)}`,
		body,
	});
}

async function deleteNotificationChannel({
	auth,
	channelId,
}: {
	auth: TelnyxAuthValue;
	channelId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: `/notification_channels/${encodeURIComponent(channelId)}`,
	});
}

async function listNotificationProfiles({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/notification_profiles', query });
}

async function createNotificationProfile({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/notification_profiles',
		body,
	});
}

async function getNotificationProfile({
	auth,
	profileId,
}: {
	auth: TelnyxAuthValue;
	profileId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/notification_profiles/${encodeURIComponent(profileId)}`,
	});
}

async function updateNotificationProfile({
	auth,
	profileId,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	profileId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PATCH,
		path: `/notification_profiles/${encodeURIComponent(profileId)}`,
		body,
	});
}

async function deleteNotificationProfile({
	auth,
	profileId,
}: {
	auth: TelnyxAuthValue;
	profileId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: `/notification_profiles/${encodeURIComponent(profileId)}`,
	});
}

async function listNotificationSettings({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/notification_settings', query });
}

async function createNotificationSetting({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/notification_settings',
		body,
	});
}

async function getNotificationSetting({
	auth,
	settingId,
}: {
	auth: TelnyxAuthValue;
	settingId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/notification_settings/${encodeURIComponent(settingId)}`,
	});
}

async function deleteNotificationSetting({
	auth,
	settingId,
}: {
	auth: TelnyxAuthValue;
	settingId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: `/notification_settings/${encodeURIComponent(settingId)}`,
	});
}

async function listNotificationEvents({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({ auth, path: '/notification_events', query });
}

async function listNotificationEventConditions({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await requestPage({
		auth,
		path: '/notification_event_conditions',
		query,
	});
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

export const telnyxAccountNotificationsApi = {
	getBalance,
	listAuditEvents,
	listAuthenticationProviders,
	listNotificationChannels,
	createNotificationChannel,
	getNotificationChannel,
	updateNotificationChannel,
	deleteNotificationChannel,
	listNotificationProfiles,
	createNotificationProfile,
	getNotificationProfile,
	updateNotificationProfile,
	deleteNotificationProfile,
	listNotificationSettings,
	createNotificationSetting,
	getNotificationSetting,
	deleteNotificationSetting,
	listNotificationEvents,
	listNotificationEventConditions,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
