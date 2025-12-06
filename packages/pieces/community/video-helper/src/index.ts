import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { extractAudio } from "./lib/actions/extract-audio.action";
import { trimVideo } from "./lib/actions/trim-video.action";

export const videoHelper = createPiece({
  displayName: "Video Helper",
  minimumSupportedRelease: "0.2.0",
  logoUrl: "https://cdn-icons-png.flaticon.com/512/8145/8145130.png",
  authors: ["lau90eth"],

  categories: [PieceCategory.CONTENT_AND_FILES],

  auth: undefined,

  actions: [
    extractAudio,
    trimVideo,
    // aggiungeremo poi:
    // extractThumbnail,
    // convertVideo,
    // mergeVideos,
  ],

  triggers: [],
});
