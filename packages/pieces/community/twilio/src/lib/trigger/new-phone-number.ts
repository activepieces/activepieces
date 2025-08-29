import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callTwilioApi } from '../common';
import { twilioAuth } from '../..';

// The full structure of an IncomingPhoneNumber object from the Twilio API
interface TwilioPhoneNumber {
    sid: string;
    account_sid: string;
    friendly_name: string;
    phone_number: string;
    voice_url: string;
    voice_method: string;
    sms_url: string;
    sms_method: string;
    date_created: string;
    date_updated: string;
    capabilities: {
        voice: boolean;
        sms: boolean;
        mms: boolean;
    };
    uri: string;
}

interface IncomingPhoneNumbersResponse {
    incoming_phone_numbers: TwilioPhoneNumber[];
}

export const twilioNewPhoneNumber = createTrigger({
    auth: twilioAuth,
    name: 'new_phone_number',
    displayName: 'New Phone Number',
    description: 'Fires when you add a new phone number to your Twilio account.',
    props: {},
    sampleData: {
        "sid": "PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "account_sid": "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "friendly_name": "(555) 123-4567",
        "phone_number": "+15551234567",
        "voice_url": "https://demo.twilio.com/welcome/voice/",
        "voice_method": "POST",
        "sms_url": "https://demo.twilio.com/welcome/sms/",
        "sms_method": "POST",
        "date_created": "2025-08-28T11:44:10+00:00",
        "date_updated": "2025-08-28T11:44:10+00:00",
        "capabilities": {
            "voice": true,
            "sms": true,
            "mms": true
        },
        "uri": "/2010-04-01/Accounts/ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX/IncomingPhoneNumbers/PNXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.json"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const response = await callTwilioApi<IncomingPhoneNumbersResponse>(
            HttpMethod.GET,
            'IncomingPhoneNumbers.json',
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            },
            {}
        );
        const sids = response.body.incoming_phone_numbers.map(p => p.sid);
        await context.store.put('twilio_phone_number_sids', sids);
    },

    async onDisable(context) {
        await context.store.delete('twilio_phone_number_sids');
    },

    async run(context) {
        const oldSids = (await context.store.get<string[]>('twilio_phone_number_sids')) ?? [];
        const oldSidsSet = new Set(oldSids);

        const response = await callTwilioApi<IncomingPhoneNumbersResponse>(
            HttpMethod.GET,
            'IncomingPhoneNumbers.json',
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            },
            {}
        );

        const currentNumbers = response.body.incoming_phone_numbers;
        const newNumbers: TwilioPhoneNumber[] = [];

        for (const number of currentNumbers) {
            if (!oldSidsSet.has(number.sid)) {
                newNumbers.push(number);
            }
        }
        
        if (newNumbers.length > 0) {
            const currentSids = currentNumbers.map(p => p.sid);
            await context.store.put('twilio_phone_number_sids', currentSids);
        }

        return newNumbers;
    },
});