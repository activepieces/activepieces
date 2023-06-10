
import { createPiece } from "@activepieces/pieces-framework";
import { createTweet } from "./lib/actions/create-tweet";

export const twitter = createPiece({
  displayName: "Twitter",
  logoUrl: "https://cdn.activepieces.com/pieces/twitter.png",
  authors: ["abuaboud"],
  actions: [createTweet],
  triggers: [],
});
