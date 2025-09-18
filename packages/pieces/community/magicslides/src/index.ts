import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { MagicSlidesAuth } from "./lib/common/auth";
import { createPptFromTopic } from "./lib/actions/create-ppt-from-topic";
import { createPptFromSummary } from "./lib/actions/create-ppt-from-summary";
import { createPptFromYoutube } from "./lib/actions/create-ppt-from-youtube"; 

export const magicslides = createPiece({
    displayName: "Magicslides",
    description: "AI-powered presentation generation from a topic, summary, or YouTube video.",
    auth: MagicSlidesAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/magicslides.png",
    categories: [PieceCategory.CONTENT_AND_FILES],
    authors: [],
    actions: [
        createPptFromTopic,
        createPptFromSummary,
        createPptFromYoutube 
    ],
    triggers: [],
});