import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

import { createPost } from "./lib/actions/create-post";
import { createPhotoPost } from "./lib/actions/create-photo-post";
import { createVideoPost } from "./lib/actions/create-video-post";

export const facebookPages = createPiece({
    name: "facebook-pages",
    displayName: "Facebook Pages",
    logoUrl: "https://cdn.activepieces.com/pieces/facebook.png",
    version: packageJson.version,
    authors: ['MoShizzle'],
    actions: [createPost, createPhotoPost, createVideoPost],
    triggers: [],
});
