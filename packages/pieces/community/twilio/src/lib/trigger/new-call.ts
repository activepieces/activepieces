import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twilioAuth } from '../..';
import { callTwilioApi } from '../common';

interface Call {
    sid: string;
    status: string;
    direction: string;
    from: string;
    to: string;
    start_time: string;
    end_time: string;
    duration: string;
    price: string;
    price_unit: string;
}

interface CallsResponse {
    calls: Call[];
}

interface StoreValue {
    lastCallSid?: string;
}

// Helper function to build the URL path with query parameters
const buildPathWithParams = (props: { to_number?: string; status?: string[] }, pageSize?: number): string => {
    const params = new URLSearchParams();
    if (props.to_number) {
        params.append('To', props.to_number);
    }
    if (props.status && props.status.length > 0) {
        props.status.forEach(s => params.append('Status', s));
    }
    if (pageSize) {
        params.append('PageSize', pageSize.toString());
    }
    const queryString = params.toString();
    return `Calls.json${queryString ? '?' + queryString : ''}`;
};

export const twilioNewCall = createTrigger({
    auth: twilioAuth,
    name: 'new_call',
    displayName: 'New Call',
    description: 'Fires when a call completes (incoming or outgoing).',
    props: {
        to_number: Property.ShortText({
            displayName: 'To Number (Optional)',
            description: 'The Twilio phone number that received the call. If not provided, the trigger will run on all numbers in the account.',
            required: false,
        }),
        // FIX: Changed MultiSelectDropdown to StaticMultiSelectDropdown
        status: Property.StaticMultiSelectDropdown({
            displayName: 'Status (Optional)',
            description: 'Select the call statuses to trigger on. If none are selected, the trigger will run for any terminal status.',
            required: false,
            options: {
                options: [
                    { label: "Completed", value: "completed" },
                    { label: "Busy", value: "busy" },
                    { label: "No Answer", value: "no-answer" },
                    { label: "Canceled", value: "canceled" },
                    { label: "Failed", value: "failed" },
                ]
            }
        })
    },
    sampleData: {
        "sid": "CAXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
        "direction": "inbound",
        "from": "+15551234567",
        "to": "+15557654321",
        "start_time": "2025-08-28T11:55:29+00:00",
        "end_time": "2025-08-28T11:55:44+00:00",
        "status": "completed",
        "duration": "15",
        "price": "-0.03000",
        "price_unit": "USD",
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const path = buildPathWithParams(context.propsValue, 1);

        const response = await callTwilioApi<CallsResponse>(
            HttpMethod.GET,
            path,
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            }
        );
        
        const lastCallSid = response.body.calls[0]?.sid;
        await context.store.put<StoreValue>('twilio_new_call', { lastCallSid });
    },

    async onDisable(context) {
        await context.store.delete('twilio_new_call');
    },

    async run(context) {
        const { lastCallSid } = (await context.store.get<StoreValue>('twilio_new_call')) ?? {};
        const path = buildPathWithParams(context.propsValue);
        
        const response = await callTwilioApi<CallsResponse>(
            HttpMethod.GET,
            path,
            {
                account_sid: context.auth.username,
                auth_token: context.auth.password,
            }
        );

        const allCalls = response.body.calls;
        const newCalls: Call[] = [];
        
        const newestCallSidInBatch = allCalls[0]?.sid;

        for (const call of allCalls) {
            if (call.sid === lastCallSid) {
                break;
            }
            newCalls.push(call);
        }

        if (newestCallSidInBatch) {
            await context.store.put<StoreValue>('twilio_new_call', { lastCallSid: newestCallSidInBatch });
        }
        
        return newCalls.reverse();
    },
});