import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../index';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTranscript } from '../common/queries';
import { BASE_URL } from '../common';

export const newTranscriptionCompletedTrigger = createTrigger({
	auth: firefliesAiAuth,
	name: 'new_transcription_completed',
	displayName: 'New Transcription Completed',
	description: 'Triggered when a new meeting is transcribed.',
	props: {
		webhookInstructions: Property.MarkDown({
			value: `
			## Fireflies.ai Webhook Setup
			To use this trigger, you need to manually set up a webhook in your Fireflies.ai account:

			1. Login to your Fireflies.ai account.
			2. Navigate to **Settings** > **Developer Settings** in the left sidebar.
			3. Enter the following URL in the webhooks field:
			\`\`\`text
			{{webhookUrl}}
			\`\`\`
			4. Click Save to register the webhook.

			This webhook will be triggered when a meeting transcription is completed.
			`,
		}),
	},
	type: TriggerStrategy.WEBHOOK,
	sampleData: undefined,
	async onEnable(context) {
		// No need to register webhooks programmatically as user will do it manually
	},
	async onDisable(context) {
		// No need to unregister webhooks as user will do it manually
	},
	async test(context) {
		const query = `
		query Transcripts(
		$limit: Int
		$skip: Int 
		){
			transcripts(
				limit: $limit
				skip: $skip
			){
				
				id
			dateString
			privacy
			speakers 
            {
                id
                name
			}
			title
			host_email
			organizer_email
			calendar_id
			user 
            {
                user_id
                email
                name
                num_transcripts
                recent_meeting
                minutes_consumed
                is_admin
                integrations
			}
			fireflies_users
			participants
			date
			transcript_url
			audio_url
			video_url
			duration
			meeting_attendees 
            {
                displayName
                email
                phoneNumber
                name
                location
			}
			summary 
            {
                keywords
                action_items
                outline
                shorthand_bullet
                overview
                bullet_gist
                gist
                short_summary
                short_overview
                meeting_type
                topics_discussed
                transcript_chapters
			}
			cal_id
			calendar_type
			meeting_info 
            {
                fred_joined
                silent_meeting
                summary_status
			}
			meeting_link
		}
		}`;
		const response = await httpClient.sendRequest<{ data: { transcripts: Record<string, any>[] } }>(
			{
				url: BASE_URL,
				method: HttpMethod.POST,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: context.auth,
				},
				body: {
					query,
					variables: {
						limit: 5,
						skip: 0,
					},
				},
			},
		);
		return response.body.data.transcripts;
	},
	async run(context) {
		const payload = context.payload.body as { meetingId: string; eventType: string };
		if (payload.eventType !== 'Transcription completed') {
			return [];
		}

		const response = await httpClient.sendRequest<{ data: { transcript: Record<string, any> } }>({
			url:BASE_URL,
			method: HttpMethod.POST,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: context.auth,
			},
			body: {
				query: getTranscript,
				variables: {
					transcriptId: payload.meetingId,
				},
			},
		});

		return [response.body.data.transcript];
	},
});
