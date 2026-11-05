import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function createCall({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/calls',
		body,
	});
	return response.data;
}

async function getCallStatus({
	auth,
	callControlId,
}: CallParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/calls/${encodeURIComponent(callControlId)}`,
	});
	return response.data;
}

async function sendCallCommand({
	auth,
	callControlId,
	command,
	body,
}: CallParams &
	BodyParams & {
		auth: TelnyxAuthValue;
		command: TelnyxCallCommand;
	}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/calls/${encodeURIComponent(callControlId)}/actions/${command}`,
		body,
	});
	return response.data;
}

async function updateCallClientState({
	auth,
	callControlId,
	clientState,
}: CallParams & {
	auth: TelnyxAuthValue;
	clientState: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.PUT,
		path: `/calls/${encodeURIComponent(callControlId)}/actions/client_state_update`,
		body: { client_state: clientState },
	});
	return response.data;
}

async function listCallEvents({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/call_events',
		query,
	});
}

async function listQueues({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/queues',
		query,
	});
}

async function createQueue({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/queues',
		body,
	});
	return response.data;
}

async function getQueue({
	auth,
	queueName,
}: QueueParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/queues/${encodeURIComponent(queueName)}`,
	});
	return response.data;
}

async function updateQueue({
	auth,
	queueName,
	maxSize,
}: QueueParams & {
	auth: TelnyxAuthValue;
	maxSize: number;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/queues/${encodeURIComponent(queueName)}`,
		body: { max_size: maxSize },
	});
	return response.data;
}

async function deleteQueue({
	auth,
	queueName,
}: QueueParams & { auth: TelnyxAuthValue }): Promise<void> {
	await telnyxClient.request<unknown>({
		auth,
		method: HttpMethod.DELETE,
		path: `/queues/${encodeURIComponent(queueName)}`,
	});
}

async function listQueueCalls({
	auth,
	queueName,
	query,
}: QueueParams & QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `/queues/${encodeURIComponent(queueName)}/calls`,
		query,
	});
}

export const telnyxCallsApi = {
	createCall,
	getCallStatus,
	sendCallCommand,
	updateCallClientState,
	listCallEvents,
	listQueues,
	createQueue,
	getQueue,
	updateQueue,
	deleteQueue,
	listQueueCalls,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
type CallParams = { callControlId: string };
type QueueParams = { queueName: string };
type TelnyxCallCommand =
	| 'answer'
	| 'hangup'
	| 'reject'
	| 'speak'
	| 'playback_start'
	| 'playback_stop'
	| 'gather'
	| 'gather_using_speak'
	| 'gather_using_audio'
	| 'gather_stop'
	| 'send_dtmf'
	| 'transfer'
	| 'bridge'
	| 'refer'
	| 'record_start'
	| 'record_stop'
	| 'record_pause'
	| 'record_resume'
	| 'transcription_start'
	| 'transcription_stop'
	| 'enqueue'
	| 'leave_queue'
	| 'switch_supervisor_role';
