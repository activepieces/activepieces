import { createPiece } from "@activepieces/pieces-framework";

import { createPost } from "./lib/actions/create-post";
import { createPhotoPost } from "./lib/actions/create-photo-post";
import { createVideoPost } from "./lib/actions/create-video-post";

export const facebookPages = createPiece({
    displayName: "Facebook Pages",
    logoUrl: "https://cdn.activepieces.com/pieces/facebook.png",
    authors: ['MoShizzle'],
    actions: [createPost, createPhotoPost, createVideoPost],
    triggers: [],
});
