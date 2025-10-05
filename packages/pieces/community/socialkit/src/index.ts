
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getYoutubeComment } from "./lib/actions/get-youtube-comment";
import { getYoutubeDetails } from "./lib/actions/get-youtube-details";
import { getYoutubeSummary } from "./lib/actions/get-youtube-summary";
import { getYoutubeTranscript } from "./lib/actions/get-youtube-transcript";
import { SocialKitAuth } from "./lib/common/auth";

export const socialkit = createPiece({
  displayName: "Socialkit",
  auth: SocialKitAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/socialkit.png",
  authors: ["Niket2035"],
  actions: [getYoutubeComment, getYoutubeDetails, getYoutubeSummary, getYoutubeTranscript],
  triggers: [],
});
