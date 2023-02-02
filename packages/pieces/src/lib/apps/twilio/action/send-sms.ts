import { HttpMethod } from "../../../common/http/core/http-method";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { callTwilioApi, twilioCommon } from "../common";


export const twilioSendSms = createAction({
    name: 'send_sms',
    description: 'Send a new SMS message',
    displayName: 'Send SMS',
    props: {
        account_sid: twilioCommon.account_sid,
        auth_token: twilioCommon.auth_token,
        from: Property.Dropdown({
            description: 'The phone number to send the message from',
            displayName: 'From',
            required: true,
            refreshers: ['account_sid', 'auth_token'],
            options: async (propsValue) => {
                if (propsValue['account_sid'] === undefined || propsValue['auth_token'] === undefined) {
                    return {
                        disabled: true,
                        placeholder: 'connect your account first',
                        options: [],
                    };
                }
                const account_sid = propsValue['account_sid'] as string;
                const auth_token = propsValue['auth_token'] as string;
                const response = await callTwilioApi<{ incoming_phone_numbers: { phone_number: string, friendly_name: string }[] }>(HttpMethod.GET, 'IncomingPhoneNumbers.json', { account_sid, auth_token });
                return {
                    disabled: false,
                    options: response.body.incoming_phone_numbers.map((number: any) => ({
                        value: number.phone_number,
                        label: number.friendly_name,
                    })),
                }
            }
        }),
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
        const auth_token = context.propsValue['auth_token']!;
        const account_sid = context.propsValue['account_sid']!;
        return await callTwilioApi(HttpMethod.POST, 'Messages.json', { account_sid, auth_token }, {
            From: from,
            Body: body,
            To: to,
        });

    }
});
