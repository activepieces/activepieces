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
		"event_type": "transcript.completed",
		"meeting": {
			"id": "abc123",
			"title": "Weekly Team Sync",
			"date": "2023-05-10T15:30:00Z",
			"duration": 3600,
			"status": "completed",
			"participants": [
				{
					"name": "John Doe",
					"email": "john@example.com"
				},
				{
					"name": "Jane Smith",
					"email": "jane@example.com"
				}
			],
			"summary": "The team discussed project progress, upcoming deadlines, and assigned new tasks.",
			"transcript_url": "https://fireflies.ai/transcript/abc123"
		},
		"timestamp": "2023-05-10T16:35:00Z"
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
