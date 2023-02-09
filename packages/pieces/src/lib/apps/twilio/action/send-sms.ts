import { HttpMethod } from "../../../common/http/core/http-method";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { callTwilioApi, twilioCommon } from "../common";


export const twilioSendSms = createAction({
    name: 'send_sms',
    description: 'Send a new SMS message',
    displayName: 'Send SMS',
    props: {
        authentication: twilioCommon.authentication,
        from: twilioCommon.phone_number,
        body: Property.ShortText({
            description: 'The body of the message to send',
            displayName: 'Message Body',
            required: true,
        }),
        to: Property.ShortText({
            description: 'The phone number to send the message to',
            displayName: 'To',
            required: true,
        })
    },
    async run(context) {
        const { body, to, from } = context.propsValue;
        const account_sid = context.propsValue['authentication']!['username']!;
        const auth_token = context.propsValue['authentication']!['password']!;
        return await callTwilioApi(HttpMethod.POST, 'Messages.json', { account_sid, auth_token }, {
            From: from,
            Body: body,
            To: to,
        });

    }
});
