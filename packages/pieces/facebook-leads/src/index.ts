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
});
