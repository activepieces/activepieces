import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';
import { callTwilioApi } from '../common';

interface Transcription {
    sid: string;
    status: string;
    date_created: string;
    recording_sid: string;
    duration: string;
    price: string;
    price_unit: string;
    transcription_text: string;
}

interface TranscriptionsResponse {
    transcriptions: Transcription[];
}

interface StoreValue {
    lastTranscriptionSid?: string;
}

export const twilioNewTranscription = createTrigger({
    auth: twilioAuth,
    name: 'new_transcription',
    displayName: 'New Transcription',
    description: 'Fires when a new call recording transcription is completed.',
    props: {},
    sampleData: {
        "sid": "TRXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "date_created": "2025-08-28T11:50:45+00:00",
        "date_updated": "2025-08-28T11:50:45+00:00",
        "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "status": "completed",
        "recording_sid": "REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "duration": "10",
        "transcription_text": "Hello, this is a test transcription.",
        "price": "0.05",
        "price_unit": "USD",
        "uri": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Transcriptions/TRXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        // Fetch the single most recent transcription to set the initial state
        const response = await callTwilioApi<TranscriptionsResponse>(
            HttpMethod.GET,
            'Transcriptions.json?PageSize=1',
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            }
        );
        // If there are any transcriptions, store the SID of the newest one
        const lastTranscriptionSid = response.body.transcriptions[0]?.sid;
        await context.store.put<StoreValue>('twilio_new_transcription', { lastTranscriptionSid });
    },

    async onDisable(context) {
        await context.store.delete('twilio_new_transcription');
    },

    async run(context) {
        const { lastTranscriptionSid } = (await context.store.get<StoreValue>('twilio_new_transcription')) ?? {};

        const response = await callTwilioApi<TranscriptionsResponse>(
            HttpMethod.GET,
            'Transcriptions.json?PageSize=50', // Fetch a reasonable number of recent transcriptions
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            }
        );

        const allTranscriptions = response.body.transcriptions;
        const newTranscriptions: Transcription[] = [];

        // The newest transcription SID from the current API call
        const newestTranscriptionSidInBatch = allTranscriptions[0]?.sid;

        for (const transcription of allTranscriptions) {
            if (transcription.sid === lastTranscriptionSid) {
                // Stop when we reach the last transcription we've already processed
                break;
            }
            newTranscriptions.push(transcription);
        }

        // If we found any new transcriptions, update the store to the newest one
        if (newestTranscriptionSidInBatch) {
            await context.store.put<StoreValue>('twilio_new_transcription', { lastTranscriptionSid: newestTranscriptionSidInBatch });
        }
        
        // Only return transcriptions that are 'completed' and process them oldest-first.
        const completedTranscriptions = newTranscriptions.filter(r => r.status === 'completed');
        return completedTranscriptions.reverse();
    },
});