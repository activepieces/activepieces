import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';

export const newCallTranscription = createTrigger({
    auth: connectucAuth,
    name: 'newCallTranscription',
    displayName: 'New Call Transcription',
    description: 'Triggers when a new call transcription is created',
    props: {
        users: Property.LongText({
            displayName: 'Users',
            description: 'Add comma-separated users to which this trigger applies',
            required: false,
        }),
    },
    sampleData: {
        id: "202602-760134328",
        cdrId: "1771251913ef8e5c02029348132eb7853dd1b154aa",
        callId: "l2e57o5cj0tlgpbrafjc",
        orig_sub: "1004",
        orig_domain: "example.11111.service",
        term_sub: "1000",
        term_domain: "example.11111.service",
        comments: [
            {
                speaker: "Karina Taylor",
                comment: "1",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:00,39",
                endTime: "00:00:01,44"
            },
            {
                speaker: "Sarojini Holmes",
                comment: "Call is being recorded.",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:00,79",
                endTime: "00:00:02,32"
            },
            {
                speaker: "Karina Taylor",
                comment: "0",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:01,68",
                endTime: "00:00:02,47"
            },
            {
                speaker: "Karina Taylor",
                comment: "0 0",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:02,48",
                endTime: "00:00:04,08"
            },
            {
                speaker: "Karina Taylor",
                comment: "is unavailable.",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:04,08",
                endTime: "00:00:05,20"
            },
            {
                speaker: "Karina Taylor",
                comment: "To dial another extension,",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:06,08",
                endTime: "00:00:08,16"
            },
            {
                speaker: "Karina Taylor",
                comment: "press 1.",
                created: "2026-02-17T00:44:17.000000Z",
                startTime: "00:00:08,24",
                endTime: "00:00:09,03"
            }
        ],
        summary: null,
        status: "finished"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'NewCallTranscription',
            context,
        });
    },
    async onDisable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await unregisterConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            context,
        });
    },
    async run(context){
        return [context.payload.body]
    }
})
