import { createPiece } from "@activepieces/pieces-framework";
import { createShareUpdate } from "./lib/actions/new-post";

export const linkedin = createPiece({
    displayName: "LinkedIn",
    logoUrl: "https://cdn.activepieces.com/pieces/linkedin.png",
    authors: ['MoShizzle'],
    actions: [createShareUpdate],
    triggers: [],
});
