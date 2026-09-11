import {
    createTrigger,
    Property,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { hkVoiceAuth } from '../auth';

const ALL_EVENTS = [
    'call.started',
    'call.connected',
    'call.ended',
    'call.failed',
    'call.recording_available',
    'call.analysis_completed',
] as const;

const SAMPLE_CALL = {
    call_id: '22222222-2222-2222-2222-222222222222',
    direction: 'outbound',
    status: 'completed',
    outcome: null,
    outcome_code: null,
    disposition: 'interested',
    from_number: '+911234567890',
    to_number: '+919876543210',
    started_at: '2026-03-20T12:00:00Z',
    answered_at: '2026-03-20T12:00:05Z',
    ended_at: '2026-03-20T12:01:35Z',
    duration_seconds: 95,
    attempt_number: 1,
    campaign_id: null,
    agent: {
        id: '34981331-0000-0000-0000-000000000001',
        name: 'Noora',
    },
    contact: {
        id: 'a742a438-0000-0000-0000-000000000001',
        name: 'Jack Guest',
        phone: '+919876543210',
        email: 'jack@example.com',
        custom_fields: {
            reservation_id: 'R-1024',
            lead_id: 'EZ-4471',
        },
    },
    variables: {
        name: 'Jack',
        reservation_id: 'R-1024',
        lead_id: 'EZ-4471',
    },
};

function createVoiceWebhookTrigger({
    name,
    displayName,
    description,
    event,
    sampleData,
}: {
    name: string;
    displayName: string;
    description: string;
    event: (typeof ALL_EVENTS)[number] | 'any';
    sampleData: Record<string, unknown>;
}) {
    return createTrigger({
        auth: hkVoiceAuth,
        name,
        displayName,
        description,
        classification: 'READ',
        aiMetadata: {
            description: `${description} Paste this trigger webhook URL into Dispatch Outbound Call → Event webhook URL (or campaign metadata). Idempotent on delivery id.`,
        },
        type: TriggerStrategy.WEBHOOK,
        props: {
            markdown: Property.MarkDown({
                value:
                    event === 'any'
                        ? 'Copy this flow webhook URL into Voice `event_webhook_url` when dispatching a call (or configure it on the campaign). Voice POSTs lifecycle events here. Deduplicate on payload `id`. Use `call.variables` to rejoin the guest record.'
                        : `Copy this flow webhook URL into Voice \`event_webhook_url\` when dispatching. This trigger only continues for \`${event}\`. Deduplicate on payload \`id\`. Use \`call.variables\` to rejoin the guest record.`,
            }),
        },
        sampleData,
        async onEnable() {
            return;
        },
        async onDisable() {
            return;
        },
        async run(context) {
            const payload = context.payload.body;
            if (typeof payload !== 'object' || payload === null) {
                return [];
            }
            const record = payload as Record<string, unknown>;
            if (event !== 'any' && record['event'] !== event) {
                return [];
            }
            return [record];
        },
    });
}

export const callAnalysisCompletedTrigger = createVoiceWebhookTrigger({
    name: 'call_analysis_completed',
    displayName: 'Voice AI Call Analysis Completed',
    description:
        'Fires when Voice AI finishes post-call analysis (summary, sentiment, lead score, extracted answers, media). Preferred post-call trigger for PDF / email / CRM after an AI voice call.',
    event: 'call.analysis_completed',
    sampleData: {
        id: '11111111-1111-1111-1111-111111111111',
        event: 'call.analysis_completed',
        occurred_at: '2026-03-20T12:02:00Z',
        call: SAMPLE_CALL,
        analysis: {
            summary: 'Guest confirmed checkout time and requested late checkout.',
            short_summary: 'Late checkout requested.',
            sentiment: 'positive',
            lead_score: 82.0,
            disposition: 'interested',
            extracted_responses: [
                {
                    question: 'Do you need a late checkout?',
                    variableName: 'late_checkout',
                    answer: 'Yes, until 2pm',
                    weight: 8,
                },
            ],
        },
        media: {
            recording_url: 'https://example.com/recording.mp3?X-Amz-Signature=…',
            transcript_url: 'https://example.com/transcript.json?X-Amz-Signature=…',
            expires_in: 3600,
        },
    },
});

export const callEndedTrigger = createVoiceWebhookTrigger({
    name: 'call_ended',
    displayName: 'Voice AI Call Ended',
    description:
        'Fires when a Voice AI call ends normally. Analysis may arrive later — prefer Voice AI Call Analysis Completed for summaries.',
    event: 'call.ended',
    sampleData: {
        id: '33333333-3333-3333-3333-333333333333',
        event: 'call.ended',
        occurred_at: '2026-03-20T12:01:35Z',
        call: SAMPLE_CALL,
        data: {
            event: 'room_finished',
        },
    },
});

export const callFailedTrigger = createVoiceWebhookTrigger({
    name: 'call_failed',
    displayName: 'Voice AI Call Failed',
    description: 'Fires when a Voice AI / AI phone call fails (busy, no answer, dispatch error).',
    event: 'call.failed',
    sampleData: {
        id: '44444444-4444-4444-4444-444444444444',
        event: 'call.failed',
        occurred_at: '2026-03-20T12:00:30Z',
        call: {
            ...SAMPLE_CALL,
            status: 'failed',
            outcome: 'no_answer',
            outcome_code: 'no_answer',
            answered_at: null,
            ended_at: '2026-03-20T12:00:30Z',
            duration_seconds: 0,
            disposition: null,
        },
    },
});

export const anyCallEventTrigger = createVoiceWebhookTrigger({
    name: 'any_call_event',
    displayName: 'Any Voice AI Call Event',
    description: 'Fires for any Voice AI call lifecycle webhook delivered to this URL.',
    event: 'any',
    sampleData: {
        id: '55555555-5555-5555-5555-555555555555',
        event: 'call.started',
        occurred_at: '2026-03-20T12:00:00Z',
        call: {
            ...SAMPLE_CALL,
            status: 'started',
            answered_at: null,
            ended_at: null,
            duration_seconds: null,
            disposition: null,
        },
    },
});
