import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { newLead } from "./lib/triggers/new-lead";

export const facebookLeads = createPiece({
    name: "facebook-leads",
    displayName: "Facebook Leads",
    logoUrl: "https://cdn.activepieces.com/pieces/facebook.png",
    version: packageJson.version,
    authors: ['MoShizzle'],
    actions: [],
    triggers: [newLead],
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
            return { event: 'lead', identifierValue: payload.body.entry[0].changes[0].value.page_id }
        },
        verify: () => {
            // TODO IMPLEMENT VALIDATION AFTER APP VERIFICATION
            return true;
        }
    }
});
