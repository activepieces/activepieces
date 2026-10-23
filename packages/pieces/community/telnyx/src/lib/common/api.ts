import { HttpMethod } from '@activepieces/pieces-common';

import { telnyxClient } from './client';

import type {
	TelnyxAuthValue,
	TelnyxCall,
	TelnyxMessage,
	TelnyxMessagingProfile,
	TelnyxResponse,
} from './types';

async function listMessagingProfiles({
	auth,
}: {
	auth: TelnyxAuthValue;
}): Promise<TelnyxResponse<TelnyxMessagingProfile[]>> {
	return await telnyxClient.request<TelnyxResponse<TelnyxMessagingProfile[]>>({
		auth,
		method: HttpMethod.GET,
		path: '/messaging_profiles',
	});
}

async function sendMessage({
	auth,
	from,
	to,
	text,
	messagingProfileId,
}: SendMessageParams & { auth: TelnyxAuthValue }): Promise<TelnyxResponse<TelnyxMessage>> {
	return await telnyxClient.request<TelnyxResponse<TelnyxMessage>>({
		auth,
		method: HttpMethod.POST,
		path: '/messages',
		body: {
			from,
			to,
			text,
			...(messagingProfileId ? { messaging_profile_id: messagingProfileId } : {}),
		},
	});
}

async function dialCall({
	auth,
	connectionId,
	from,
	to,
	audioUrl,
	webhookUrl,
	timeoutSecs,
}: DialCallParams & { auth: TelnyxAuthValue }): Promise<TelnyxResponse<TelnyxCall>> {
	return await telnyxClient.request<TelnyxResponse<TelnyxCall>>({
		auth,
		method: HttpMethod.POST,
		path: '/calls',
		body: {
			connection_id: connectionId,
			from,
			to,
			...(audioUrl ? { audio_url: audioUrl } : {}),
			...(webhookUrl ? { webhook_url: webhookUrl } : {}),
			...(timeoutSecs ? { timeout_secs: timeoutSecs } : {}),
		},
	});
}

export const telnyxApi = { listMessagingProfiles, sendMessage, dialCall };

type SendMessageParams = {
	from: string;
	to: string;
	text: string;
	messagingProfileId?: string;
};

type DialCallParams = {
	connectionId: string;
	from: string;
	to: string;
	audioUrl?: string;
	webhookUrl?: string;
	timeoutSecs?: number;
};
