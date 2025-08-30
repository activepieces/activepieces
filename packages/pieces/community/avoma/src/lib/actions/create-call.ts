import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { avomaAuth, avomaApiUrl } from "../..";

export const createCall = createAction({
    auth: avomaAuth,
    name: 'create_call',
    displayName: 'Create Call',
    description: 'Creates a new call record in Avoma from a recording URL.',
    props: {
        user_email: Property.ShortText({
            displayName: 'Avoma User Email',
            description: "Email of the Avoma user who made/received the call. A license will be used for this user.",
            required: true,
        }),
        external_id: Property.ShortText({
            displayName: 'External ID',
            description: 'The unique ID of the call from the original dialer system (e.g., Twilio Call SID).',
            required: true,
        }),
        source: Property.ShortText({
            displayName: 'Source',
            description: 'The source of the call, e.g., zoom, twilio, ringcentral.',
            required: true,
        }),
        direction: Property.StaticDropdown({
            displayName: 'Direction',
            description: 'Direction of the call.',
            required: true,
            options: {
                options: [
                    { label: 'Inbound', value: 'Inbound' },
                    { label: 'Outbound', value: 'Outbound' },
                ]
            }
        }),
        to: Property.ShortText({
            displayName: 'To Phone Number',
            description: 'The phone number the call was made to.',
            required: true,
        }),
        frm: Property.ShortText({
            displayName: 'From Phone Number',
            description: 'The phone number the call was made from.',
            required: true,
        }),
        recording_url: Property.ShortText({
            displayName: 'Recording URL',
            description: 'A public URL to the call recording. Avoma will download and process it.',
            required: true,
        }),
        start_at: Property.DateTime({
            displayName: 'Start Time',
            description: 'The start date and time of the call.',
            required: true,
        }),
        participants: Property.Json({
            displayName: 'Participants',
            description: "A JSON array of participants. The first entry should be the prospect/lead.",
            required: true,
            defaultValue: [
                { "name": "John Doe", "email": "john.doe@example.com" }
            ]
        }),
        end_at: Property.DateTime({
            displayName: 'End Time',
            description: 'The end date and time of the call.',
            required: false,
        }),
        to_name: Property.ShortText({
            displayName: 'To Name',
            description: 'Name of the person to whom the call was made.',
            required: false,
        }),
        frm_name: Property.ShortText({
            displayName: 'From Name',
            description: 'Name of the person who made the call.',
            required: false,
        }),
        answered: Property.Checkbox({
            displayName: 'Answered',
            description: 'Check this box if the call was answered.',
            required: false,
        }),
        is_voicemail: Property.Checkbox({
            displayName: 'Is Voicemail',
            description: 'Check this box if the call is a voicemail.',
            required: false,
        }),
        additional_details: Property.Json({
            displayName: 'Additional Details',
            description: 'A JSON object for any additional details about the call.',
            required: false,
        })
    },
    async run(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${avomaApiUrl}/v1/calls/`,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            },
            body: {
                ...context.propsValue
            },
        });

        return response.body;
    },
});