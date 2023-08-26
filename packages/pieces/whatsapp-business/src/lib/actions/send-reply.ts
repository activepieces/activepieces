import { Property, createAction } from "@activepieces/pieces-framework"
import { whatappBusinessAuth } from "../..";
import { whatsappBusinessCommon } from "../common";

export const sendReply = createAction({
    auth: whatappBusinessAuth,
    name: 'send_reply',
    displayName: 'Send Reply',
    description: 'Send a reply to an existing conversation',
    props: {
        messageId: Property.ShortText({
            displayName: 'Message ID',
            description: 'The ID of the message to reply to.',
            required: true
        }),
        phoneNumber: whatsappBusinessCommon.phoneNumber,
        to: whatsappBusinessCommon.to,
        text: whatsappBusinessCommon.message
    },
    async run(context) {
        const result = await whatsappBusinessCommon.sendMessage(context.auth.access_token, {
            whatsappNumberId: context.propsValue.phoneNumber as any,
            to: context.propsValue.to,
            type: 'text',
            text: context.propsValue.text,
            messageId: context.propsValue.messageId
        });

        return result;
    }
});
