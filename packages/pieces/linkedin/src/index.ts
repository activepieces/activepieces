import { createPiece } from "@activepieces/pieces-framework";

import { createShareUpdate } from "./lib/actions/create-share-update";
import { createCompanyUpdate } from "./lib/actions/create-company-update";

export const linkedin = createPiece({
    displayName: "LinkedIn",
    logoUrl: "https://cdn.activepieces.com/pieces/linkedin.png",
    authors: ['MoShizzle'],
    actions: [createShareUpdate, createCompanyUpdate],
    triggers: [],
});
