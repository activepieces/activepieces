import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { isNil } from '@activepieces/shared';
import { firefliesAiAuth } from '../../index';

export const newTranscriptionCompleteTrigger = createTrigger({
	auth: firefliesAiAuth,
	name: 'new_transcription_complete',
	displayName: 'New Transcription Complete',
	description: 'Triggered when a new meeting is transcribed',
	props: {
		webhookInstructions: Property.MarkDown({
			value: `
## Fireflies.ai Webhook Setup
To use this trigger, you need to manually set up a webhook in your Fireflies.ai account:

1. Login to your Fireflies.ai account
2. Navigate to **Settings** > **Developer Settings** in the left sidebar
3. Enter the following URL in the webhooks field:
\`\`\`
{{webhookUrl}}
\`\`\`
4. Click Save to register the webhook

This webhook will be triggered when a meeting transcription is completed.
			`,
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: {
		"meetingId": "ASxwZxCstx",
		"eventType": "Transcription completed",
		"clientReferenceId": "be582c46-4ac9-4565-9ba6-6ab4264496a8"
	},
	async onEnable(context) {
		// No need to register webhooks programmatically as user will do it manually
	},
	async onDisable(context) {
		// No need to unregister webhooks as user will do it manually
	},
	async run(context) {
		return [context.payload.body];
	},
});
