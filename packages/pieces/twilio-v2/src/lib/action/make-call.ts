import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { callTwilioApi, twilioCommon } from "../common";
import { twilioAuth } from "../..";

export const twilioMakeCall = createAction({
    auth: twilioAuth,
    name: 'make_call',
    description: 'Make a call',
    displayName: 'Make Call',
    props: {
        from: twilioCommon.phone_number,
        twimlUrl: Property.ShortText({
            description: 'The URL for your TwiML instructions for the call',
            displayName: 'TwiML URL',
            required: true,
        }),
        to: Property.ShortText({
            description: 'The phone number of the person to call',
            displayName: 'To',
            required: true,
        })
    },
    async run(context) {
        const { twimlUrl, to, from } = context.propsValue;
        const account_sid = context.auth.username;
        const auth_token = context.auth.password;

        if (!twimlUrl) {
            throw new Error('TwiML URL must be provided');
        }

        return await callTwilioApi(HttpMethod.POST, 'Calls.json', { account_sid, auth_token }, {
            From: from,
            Url: twimlUrl,
            To: to,
        });
    }
});
