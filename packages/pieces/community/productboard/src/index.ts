
import { createPiece } from "@activepieces/pieces-framework";
import { productboardAuth } from "./lib/common/auth";
import { createFeature } from "./lib/actions/create-feature";
import { createNote } from "./lib/actions/create-note";
import { updateFeature } from "./lib/actions/update-feature";
import { getFeature } from "./lib/actions/get-feature";
import { newFeature } from "./lib/triggers/new-feature";
import { newNote } from "./lib/triggers/new-note";
import { updatedFeature } from "./lib/triggers/updated-feature";
import { PieceCategory } from "@activepieces/shared";

export const productboard = createPiece({
    displayName: "Productboard",
    auth: productboardAuth,
    description: "Productboard is a product management tool that helps you manage your product roadmap and features.",
    categories: [PieceCategory.PRODUCTIVITY],
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/productboard.png",
    authors: ["owuzo", "onyedikachi-david"],
    actions: [
        createFeature,
        createNote,
        updateFeature,
        getFeature,
    ],
    triggers: [
        newFeature,
        newNote,
        updatedFeature,
    ],
});