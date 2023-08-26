import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { whatappBusinessAuth } from "../..";
import { whatsappBusinessCommon } from "../common";

export const newMessage = createTrigger({
    auth: whatappBusinessAuth,
    name: 'new_message',
    displayName: 'New Message',
    description: 'Triggers when a new message is received',
    type: TriggerStrategy.APP_WEBHOOK,
    props: {},

    async onEnable(context) {
        await whatsappBusinessCommon.subscribeWhatsappToApp((context.auth.props as any)['whatsappBusinessAccountId'], context.auth.access_token)

        context.app.createListeners({ events: ['whatsappBusinessMessage'], identifierValue: context.auth.props!['whatsappBusinessAccountId'] as string })
    },

    async onDisable() {
        //
    },

    //Return new lead
    async run(context) {
        return [context.payload.body];
    },

    sampleData: {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "0",
                "changes": [
                    {
                        "field": "messages",
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "16505551111",
                                "phone_number_id": "123456123"
                            },
                            "contacts": [
                                {
                                    "profile": {
                                        "name": "test user name"
                                    },
                                    "wa_id": "16315551181"
                                }
                            ],
                            "messages": [
                                {
                                    "from": "16315551181",
                                    "id": "ABGGFlA5Fpa",
                                    "timestamp": "1504902988",
                                    "type": "text",
                                    "text": {
                                        "body": "this is a text message"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        ]
    },
})
