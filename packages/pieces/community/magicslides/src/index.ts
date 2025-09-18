import { createPiece } from "@activepieces/pieces-framework";
import { magicslidesAuth } from "./lib/auth";
import { createPptFromTopic } from './lib/actions/create-ppt-from-topic';
import { createPptFromSummary } from './lib/actions/create-ppt-from-summary';
import { createPptFromYoutubeVideo } from './lib/actions/create-ppt-from-youtube-video';
import { PieceCategory } from "@activepieces/shared";

export const magicslides = createPiece({
  displayName: "MagicSlides",
  auth: magicslidesAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/magicslides.png",
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ['privatestefans'],
  actions: [
    createPptFromTopic,
    createPptFromSummary,
    createPptFromYoutubeVideo,
  ],
  triggers: [],
});