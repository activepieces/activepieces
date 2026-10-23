import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function listConferences({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/conferences',
		query,
	});
}

async function createConference({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/conferences',
		body,
	});
	return response.data;
}

async function getConference({
	auth,
	conferenceId,
}: ConferenceParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/conferences/${encodeURIComponent(conferenceId)}`,
	});
	return response.data;
}

async function listConferenceParticipants({
	auth,
	conferenceId,
	query,
}: ConferenceParams & QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `/conferences/${encodeURIComponent(conferenceId)}/participants`,
		query,
	});
}

async function getConferenceParticipant({
	auth,
	conferenceId,
	participantId,
}: ParticipantParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/conferences/${encodeURIComponent(conferenceId)}/participants/${encodeURIComponent(
			participantId,
		)}`,
	});
	return response.data;
}

async function updateConferenceParticipant({
	auth,
	conferenceId,
	participantId,
	body,
}: ParticipantParams & BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.PATCH,
		path: `/conferences/${encodeURIComponent(conferenceId)}/participants/${encodeURIComponent(
			participantId,
		)}`,
		body,
	});
	return response.data;
}

async function runConferenceCommand({
	auth,
	conferenceId,
	command,
	body,
}: ConferenceParams &
	BodyParams & {
		auth: TelnyxAuthValue;
		command: ConferenceCommand;
	}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/conferences/${encodeURIComponent(conferenceId)}/actions/${command}`,
		body,
	});
	return response.data;
}

export const telnyxConferencesApi = {
	listConferences,
	createConference,
	getConference,
	listConferenceParticipants,
	getConferenceParticipant,
	updateConferenceParticipant,
	runConferenceCommand,
};

type ConferenceCommand =
	| 'end'
	| 'join'
	| 'leave'
	| 'hold'
	| 'unhold'
	| 'mute'
	| 'unmute'
	| 'play'
	| 'stop'
	| 'speak'
	| 'send_dtmf'
	| 'gather_using_audio'
	| 'record_start'
	| 'record_stop'
	| 'record_pause'
	| 'record_resume'
	| 'update';
type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
type ConferenceParams = { conferenceId: string };
type ParticipantParams = ConferenceParams & { participantId: string };
