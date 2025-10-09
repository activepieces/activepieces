import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const getCallDetailsAction = createAction({
    name: 'get-call-details',
    displayName: 'Get Call Details',
    description: 'Retrieve details of a specific call by call SID.',
    auth: kallabotAuth,
    props: {
        call_sid: Property.ShortText({
            displayName: 'Call SID',
            description: 'The unique identifier of the call.',
            required: true,
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.kallabot.com/call-details/${context.propsValue.call_sid}`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            }
        });

        // Mock response data for development/testing
        const mockResponse = {
            call_sid: context.propsValue.call_sid,
            agent_id: "agent-123e4567-e89b-12d3-a456-426614174000",
            account_id: "account-123e4567-e89b-12d3-a456-426614174000",
            from_number: "+1234567890",
            to_number: "+0987654321",
            duration: 120.5,
            recording_url: "https://api.twilio.com/2010-04-01/Accounts/AC123/Recordings/RE123.wav",
            transcription: {
                conversation: [
                    {
                        speaker: "agent",
                        message: "Hello! This is regarding your recent order cancellation. How can I help you today?",
                        timestamp: "2024-01-15T10:30:05Z"
                    },
                    {
                        speaker: "customer", 
                        message: "Hi, yes I cancelled my order because I found a better price elsewhere.",
                        timestamp: "2024-01-15T10:30:15Z"
                    },
                    {
                        speaker: "agent",
                        message: "I understand. Would you be interested if I could match that price for you?",
                        timestamp: "2024-01-15T10:30:25Z"
                    }
                ],
                sentiment: "neutral",
                summary: "Customer cancelled order due to price. Interested in price matching discussion."
            },
            status: "completed",
            call_type: "outbound",
            cost: 0.25,
            created_at: "2024-01-15T10:30:00Z",
            transferred: false,
            transfer_info: null
        };

        // Return actual response in production, mock data for development
        return process.env['NODE_ENV'] === 'development' ? mockResponse : response.body;
    }
});