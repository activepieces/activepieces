import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";

import { sendMessage } from "./lib/actions/send-message";
import { newMessage } from "./lib/triggers/new-message";

export const whatappBusinessAuth = PieceAuth.OAuth2({
    authUrl: "https://graph.facebook.com/oauth/authorize",
    tokenUrl: "https://graph.facebook.com/oauth/access_token",
    required: true,
    scope: ['business_management', 'whatsapp_business_management'],
    props: {
        whatsappBusinessAccountId: Property.ShortText({
            displayName: 'WhatsApp Business Account ID',
            required: true
        })
    }
})

export const whatsappBusiness = createPiece({
    displayName: "WhatsApp Business",
    auth: whatappBusinessAuth,
    minimumSupportedRelease: '0.7.1',
    logoUrl: "https://cdn.activepieces.com/pieces/whatsapp-business.png",
    authors: ['MoShizzle'],
    actions: [sendMessage],
    triggers: [newMessage],
    events: {
        parseAndReply: (context) => {
            const payload = context.payload;
            if (payload.queryParams['hub.verify_token'] == 'activepieces') {
                return {
                    reply: {
                        body: payload.queryParams['hub.challenge'],
                        headers: {}
                    }
                };
            }

            return { event: 'whatsappBusinessMessage', identifierValue: payload.body.entry[0].changes[0].value.metadata.phone_number_id }
        },
        verify: () => {
            // TODO IMPLEMENT VALIDATION AFTER APP VERIFICATION
            return true;
        }
    }
});
