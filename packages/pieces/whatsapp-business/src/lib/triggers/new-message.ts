import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { whatappBusinessAuth } from "../..";
import { whatsappBusinessCommon } from "../common";

export const newMessage = createTrigger({
    auth: whatappBusinessAuth,
    name: 'new_message',
    displayName: 'New Message',
    description: 'Triggers when a new message is received',
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: {

    },
    props: {},

    async onEnable(context) {
        await whatsappBusinessCommon.subscribeWhatsappToApp((context.auth.props as any)['whatsappBusinessAccountId'], context.auth.access_token)
        
        // context.app.createListeners({ events: ['whatsappBusinessMessage'], identifierValue: context.auth.props!['whatsappBusinessAccountId'] as string })
        context.app.createListeners({ events: ['whatsappBusinessMessage'], identifierValue: context.auth.props!['whatsappBusinessAccountId'] as string })
    },

    async onDisable() {
        //
    },

    //Return new lead
    async run(context) {
        return [context.payload.body];
    },
})
