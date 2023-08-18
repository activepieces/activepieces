import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { contigAuth } from "../..";
import { Property, createAction } from "@activepieces/pieces-framework";



export const sendSMS = createAction({
    auth: contigAuth,
    name: 'send_sms',
    displayName: "Send SMS",
    description: "Send a text message",
    props: {
        to: Property.ShortText({
            displayName: "To",
            description: "number to send to in international format - no spacing (+<int><number>)",
            required: true,
        }),
        message: Property.LongText({
            displayName: "Content",
            description: "Message to send",
            required: true,
        }),
    },
    async run(context){
        const { to, message } = context.propsValue;
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: "https://api.contiguity.co/send/text",
            body: {
                to: to,
                message: message
            },
            headers: {
                authorization: `Token ${context.auth}`,
                "Content-Type":"application/json",
            }
        };
        return await httpClient.sendRequest(request);

    }

})