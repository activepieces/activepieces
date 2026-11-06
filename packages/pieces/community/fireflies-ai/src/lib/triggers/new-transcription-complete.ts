import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../auth';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTranscript } from '../common/queries';
import { BASE_URL } from '../common';

export const newTranscriptionCompletedTrigger = createTrigger({
	auth: firefliesAiAuth,
	name: 'new_transcription_completed',
	classification: 'READ',
	displayName: 'New Transcription Completed',
	description: 'Fires when Fireflies finishes transcribing a meeting.',
	aiMetadata: {
		description: 'Fires when Fireflies finishes transcribing a meeting, emitting the completed transcript with its summary, speakers, attendees, and media URLs. Represents a freshly available, fully processed meeting record. Requires a manually configured Fireflies webhook.',
	},
	props: {
		webhookInstructions: Property.MarkDown({
			value: `Set up the webhook in Fireflies:

1. Log in to Fireflies and open **Settings** > **Developer Settings**.
2. Paste this URL into the **Webhook** field:
\`\`\`text
{{webhookUrl}}
\`\`\`
3. Click **Save**.`,
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
					token: context.auth.secret_text,
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
				token: context.auth.secret_text,
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
