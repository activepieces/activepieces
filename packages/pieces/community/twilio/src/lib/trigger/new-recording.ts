import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';
import { callTwilioApi } from '../common';

interface Recording {
    sid: string;
    status: string;
    date_created: string;
    call_sid: string;
    duration: string;
    source: string;
    price: string;
    price_unit: string;
}

interface RecordingsResponse {
    recordings: Recording[];
}

interface StoreValue {
    lastRecordingSid?: string;
}

export const twilioNewRecording = createTrigger({
    auth: twilioAuth,
    name: 'new_recording',
    displayName: 'New Recording',
    description: 'Fires when a new call recording is completed and available.',
    props: {},
    sampleData: {
        "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "api_version": "2010-04-01",
        "call_sid": "CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "conference_sid": "CFXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "channels": 1,
        "date_created": "2025-08-28T11:45:34+00:00",
        "date_updated": "2025-08-28T11:45:38+00:00",
        "start_time": "2025-08-28T11:45:34+00:00",
        "price": "-0.00250",
        "price_unit": "USD",
        "duration": "4",
        "sid": "REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "source": "StartConferenceRecordingAPI",
        "status": "completed",
        "error_code": null,
        "uri": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/Recordings/REXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        // Fetch the single most recent recording to set the initial state
        const response = await callTwilioApi<RecordingsResponse>(
            HttpMethod.GET,
            'Recordings.json?PageSize=1',
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            }
        );
        // If there are any recordings, store the SID of the newest one
        const lastRecordingSid = response.body.recordings[0]?.sid;
        await context.store.put<StoreValue>('twilio_new_recording', { lastRecordingSid });
    },

    async onDisable(context) {
        await context.store.delete('twilio_new_recording');
    },

    async run(context) {
        const { lastRecordingSid } = (await context.store.get<StoreValue>('twilio_new_recording')) ?? {};

        const response = await callTwilioApi<RecordingsResponse>(
            HttpMethod.GET,
            'Recordings.json?PageSize=50', // Fetch a reasonable number of recent recordings
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            }
        );

        const allRecordings = response.body.recordings;
        const newRecordings: Recording[] = [];

        // The newest recording SID from the current API call
        const newestRecordingSidInBatch = allRecordings[0]?.sid;

        for (const recording of allRecordings) {
            if (recording.sid === lastRecordingSid) {
                // Stop when we reach the last recording we've already processed
                break;
            }
            newRecordings.push(recording);
        }

        // If we found any recordings at all, update the store to the newest one
        if (newestRecordingSidInBatch) {
            await context.store.put<StoreValue>('twilio_new_recording', { lastRecordingSid: newestRecordingSidInBatch });
        }
        
        // Only return recordings that are 'completed' and process them oldest-first.
        const completedRecordings = newRecordings.filter(r => r.status === 'completed');
        return completedRecordings.reverse();
    },
});