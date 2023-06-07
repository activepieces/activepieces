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
        parseAndReply: ({ payload }) => {
            if (payload.body['hub_verify_token'] == 'testToken123') {
                return {
                    reply: {
                        body: payload.body['hub_challenge'],
                        headers: {}
                    }
                };
            }
            return { event: payload.body?.event?.type, identifierValue: payload.body.team_id }
        },
        verify: () => {
            return true;
        }
    }
});
