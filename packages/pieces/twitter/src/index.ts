
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { createTweet } from "./lib/actions/create-tweet";

export const twitter = createPiece({
  name: "twitter",
  displayName: "Twitter",
  logoUrl: "https://cdn.activepieces.com/pieces/twitter.png",
  version: packageJson.version,
  authors: ["abuaboud"],
  actions: [createTweet],
  triggers: [],
});
