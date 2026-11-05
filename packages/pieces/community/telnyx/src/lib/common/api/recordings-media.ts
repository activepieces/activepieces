import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function listRecordings({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/recordings',
		query,
	});
}

async function getRecording({
	auth,
	recordingId,
}: {
	auth: TelnyxAuthValue;
	recordingId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/recordings/${encodeURIComponent(recordingId)}`,
	});
}

async function deleteRecording({
	auth,
	recordingId,
}: {
	auth: TelnyxAuthValue;
	recordingId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: `/recordings/${encodeURIComponent(recordingId)}`,
	});
}

async function listRecordingTranscriptions({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/recording_transcriptions',
		query,
	});
}

async function getRecordingTranscription({
	auth,
	transcriptionId,
}: {
	auth: TelnyxAuthValue;
	transcriptionId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/recording_transcriptions/${encodeURIComponent(transcriptionId)}`,
	});
}

async function deleteRecordingTranscription({
	auth,
	transcriptionId,
}: {
	auth: TelnyxAuthValue;
	transcriptionId: string;
}): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.DELETE,
		path: `/recording_transcriptions/${encodeURIComponent(transcriptionId)}`,
	});
}

async function listMedia({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/media',
		query,
	});
}

async function uploadMedia({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/media',
		body,
	});
}

async function getMedia({
	auth,
	mediaName,
}: MediaParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/media/${encodeURIComponent(mediaName)}`,
	});
}

async function updateMedia({
	auth,
	mediaName,
	body,
}: MediaParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.PUT,
		path: `/media/${encodeURIComponent(mediaName)}`,
		body,
	});
}

async function deleteMedia({
	auth,
	mediaName,
}: MediaParams & { auth: TelnyxAuthValue }): Promise<void> {
	await telnyxClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/media/${encodeURIComponent(mediaName)}`,
	});
}

async function listFaxes({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/faxes',
		query,
	});
}

async function sendFax({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: '/faxes',
		body,
	});
}

async function getFax({
	auth,
	faxId,
}: FaxParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.GET,
		path: `/faxes/${encodeURIComponent(faxId)}`,
	});
}

async function deleteFax({ auth, faxId }: FaxParams & { auth: TelnyxAuthValue }): Promise<void> {
	await telnyxClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/faxes/${encodeURIComponent(faxId)}`,
	});
}

async function cancelFax({
	auth,
	faxId,
}: FaxParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: `/faxes/${encodeURIComponent(faxId)}/actions/cancel`,
	});
}

async function refreshFax({
	auth,
	faxId,
}: FaxParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	return await requestData({
		auth,
		method: HttpMethod.POST,
		path: `/faxes/${encodeURIComponent(faxId)}/actions/refresh`,
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

export const telnyxRecordingsMediaApi = {
	listRecordings,
	getRecording,
	deleteRecording,
	listRecordingTranscriptions,
	getRecordingTranscription,
	deleteRecordingTranscription,
	listMedia,
	uploadMedia,
	getMedia,
	updateMedia,
	deleteMedia,
	listFaxes,
	sendFax,
	getFax,
	deleteFax,
	cancelFax,
	refreshFax,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
type MediaParams = { mediaName: string };
type FaxParams = { faxId: string };
