import { Property, createAction } from "@activepieces/pieces-framework"
import { whatappBusinessAuth } from "../..";
import { whatsappBusinessCommon } from "../common";

export const sendMessage = createAction({
    auth: whatappBusinessAuth,
    name: 'send_message',
    displayName: 'Send Message',
    description: 'Send a message through WhatsApp Business',
    props: {
        phoneNumber: whatsappBusinessCommon.phoneNumber,
        to: whatsappBusinessCommon.to,
        template: whatsappBusinessCommon.template,
        placeholders: Property.Object({
            displayName: 'Placeholders',
            description: 'Placeholders for the message template. Use any value for the key field, and your placeholder value in value.',
            required: false
        })
    },
    async run(context) {
        const placeholders = [];
        const template: any = {
            name: (context.propsValue.template as any).name,
            language: {
                code: (context.propsValue.template as any).language
            }
        }

        if (context.propsValue.placeholders) {
            for (const key in context.propsValue.placeholders) {
                placeholders.push({
                    type: 'text',
                    text: context.propsValue.placeholders![key]
                })
            }
        }

        template.components = [{
            type: 'body',
            parameters: placeholders
        }];

        const result = await whatsappBusinessCommon.sendMessage(context.auth.access_token, {
            whatsappNumberId: context.propsValue.phoneNumber as any,
            to: context.propsValue.to,
            template: template
        })

        return result;
    }
});
