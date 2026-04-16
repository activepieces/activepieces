import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioApiCall, verifyWebhookSignature } from '../common/client';
import { attioAuth } from '../auth';
import { CallRecordingResponse, CallRecordingWebhookPayload, MeetingResponse, WebhookResponse } from '../common/types';
import { isNil } from '@activepieces/shared';

const TRIGGER_KEY = 'call-recording-created-trigger';

export const callRecordingCreatedTrigger = createTrigger({
	auth: attioAuth,
	name: 'call_recording_created',
	displayName: 'Call Recording Created',
	description: 'Triggers when a call recording finishes and its media upload is complete.',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
		workspace_id: 'aabbccdd-1122-3344-5566-aabbccdd1122',
		meeting_id: '11223344-aabb-ccdd-eeff-112233445566',
		call_recording_id: '99887766-5544-3322-1100-998877665544',
	},
	async onEnable(context) {
		const response = await attioApiCall<{ data: WebhookResponse }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/webhooks',
			body: {
				data: {
					target_url: context.webhookUrl,
					subscriptions: [
						{
							event_type: 'call-recording.created',
							filter: null,
						},
					],
				},
			},
		});

		await context.store.put<{ webhookId: string; webhookSecret: string }>(TRIGGER_KEY, {
			webhookId: response.data.id.webhook_id,
			webhookSecret: response.data.secret,
		});
	},
	async onDisable(context) {
		const webhookData = await context.store.get<{ webhookId: string; webhookSecret: string }>(
			TRIGGER_KEY,
		);
		if (!isNil(webhookData) && webhookData.webhookId) {
			await attioApiCall({
				accessToken: context.auth.secret_text,
				method: HttpMethod.DELETE,
				resourceUri: `/webhooks/${webhookData.webhookId}`,
			});
		}
	},
	async test(context) {
		const meetingsResponse = await attioApiCall<{ data: MeetingResponse[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/meetings',
			query: { limit: 5, sort: 'start_desc' },

		});

		const results: Array<{ workspace_id: string; meeting_id: string; call_recording_id: string }> = [];

		for (const meeting of meetingsResponse.data) {
			const recordingsResponse = await attioApiCall<{ data: CallRecordingResponse[] }>({
				accessToken: context.auth.secret_text,
				method: HttpMethod.GET,
				resourceUri: `/meetings/${meeting.id.meeting_id}/call_recordings`,
				query: { limit: 5 },
			});

			for (const recording of recordingsResponse.data) {
				results.push({
					workspace_id: recording.id.workspace_id,
					meeting_id: recording.id.meeting_id,
					call_recording_id: recording.id.call_recording_id,
				});
			}

			if (results.length >= 5) break;
		}

		if (results.length === 0) {
			return [
				{
					workspace_id: 'aabbccdd-1122-3344-5566-aabbccdd1122',
					meeting_id: '11223344-aabb-ccdd-eeff-112233445566',
					call_recording_id: '99887766-5544-3322-1100-998877665544',
				},
			];
		}

		return results;
	},
	async run(context) {
		const triggerData = await context.store.get<{ webhookId: string; webhookSecret: string }>(
			TRIGGER_KEY,
		);

		const webhookSecret = triggerData?.webhookSecret;
		const webhookSignatureHeader = context.payload.headers['attio-signature'];
		const rawBody = context.payload.rawBody;

		if (!verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)) {
			return [];
		}

		const payload = context.payload.body as CallRecordingWebhookPayload;
		const event = payload.events[0];

		return [
			{
				workspace_id: event.id.workspace_id,
				meeting_id: event.id.meeting_id,
				call_recording_id: event.id.call_recording_id,
			},
		];
	},
});
