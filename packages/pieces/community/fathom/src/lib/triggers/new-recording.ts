import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { FathomAuth } from '../common/auth';

export const newRecording = createTrigger({
    auth: FathomAuth,
    name: 'newRecording',
    displayName: 'New Recording',
    description: 'Fires when a new meeting recording is produced.',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        id: "rec_123456789",
        meeting_id: "mtg_987654321",
        title: "Weekly Sync Meeting",
        description: "Team weekly sync to discuss project updates",
        created_at: "2025-10-30T10:00:00Z",
        recording_url: "https://fathom.video/recording/rec_123456789",
        duration_seconds: 3600,
        participants: [
            {
                name: "Alice Johnson",
                email: "alice@example.com"
            },
            {
                name: "Bob Smith",
                email: "bob@example.com"
            }
        ],
        summary: {
            text: "Discussed project timelines, blockers, and upcoming deadlines.",
            highlights: [
                "Project timelines updated",
                "Blocked tasks identified"
            ]
        },
        transcript: [
            {
                speaker: "Alice Johnson",
                text: "Let's review the project timelines for this week."
            },
            {
                speaker: "Bob Smith",
                text: "I have some blockers to discuss."
            }
        ],
        action_items: [
            {
                task: "Update project timeline",
                assignee: "Alice Johnson",
                due_date: "2025-11-01"
            },
            {
                task: "Resolve blockers",
                assignee: "Bob Smith",
                due_date: "2025-11-03"
            }
        ],
        
    },

    async onEnable(context) {
        const apiKey = context.auth;

        const destination_url = context.webhookUrl;

        const body = {
            destination_url,
            triggered_for: ["my_recordings"],
            include_summary: true,
            include_transcript: true,
            include_action_items: true,
            include_crm_matches: false,
        };

        const response = await makeRequest(
            apiKey,
            HttpMethod.POST,
            '/webhooks',
            body
        );

        await context.store.put('webhook_id', response.id);
    },

    async onDisable(context) {
        const apiKey = context.auth;
        const webhookId = await context.store.get('webhook_id');

        if (!webhookId) {
            console.warn('No webhook ID found to delete.');
            return;
        }

        await makeRequest(apiKey, HttpMethod.DELETE, `/webhooks/${webhookId}`);
    },

    async run(context) {
        return [context.payload.body];
    },
});
