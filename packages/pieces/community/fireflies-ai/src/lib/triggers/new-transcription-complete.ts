import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRestRequest } from '../common/client';
import { isNil } from '@activepieces/shared';
import { firefliesAiAuth } from '../../index';

export const newTranscriptionCompleteTrigger = createTrigger({
	auth: firefliesAiAuth,
	name: 'new_transcription_complete',
	displayName: 'New Transcription Complete',
	description: 'Triggered when a new meeting is transcribed',
	props: {},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
            "meetingId": "ASxwZxCstx",
            "eventType": "Transcription completed",
            "clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
	},
	async onEnable(context) {
		const response = await makeRestRequest(
			context.auth as string,
			HttpMethod.POST,
			'/webhooks',
			{
				"url": context.webhookUrl,
				"events": ["transcript.completed"]
			}
		) as WebhookResponse;

		await context.store.put<{webhookId: string}>('new_transcription_complete', {
			webhookId: response.id
		});
	},
	async onDisable(context) {
		const webhook = await context.store.get<{webhookId: string}>('new_transcription_complete');

		if (!isNil(webhook) && !isNil(webhook.webhookId)) {
			await makeRestRequest(
				context.auth as string,
				HttpMethod.DELETE,
				`/webhooks/${webhook.webhookId}`,
				{}
			);
		}
	},
	async run(context) {
		return [context.payload.body];
	},
});

interface WebhookResponse {
	id: string;
	url: string;
	events: string[];
	created_at: string;
}
