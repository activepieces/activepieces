import { createPiece } from "@activepieces/pieces-framework";

import { uploadPhoto } from "./lib/actions/upload-photo";
import { uploadReel } from "./lib/actions/upload-reel";

export const instagramBusiness = createPiece({
    displayName: "Instagram for Business",
    logoUrl: "https://cdn.activepieces.com/pieces/instagram.png",
    authors: ['MoShizzle'],
    actions: [uploadPhoto, uploadReel],
    triggers: [],
});
