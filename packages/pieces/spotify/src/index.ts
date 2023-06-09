
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import actions from './lib/actions'
import triggers from "./lib/triggers";

export const spotify = createPiece({
  name: "spotify",
  displayName: "Spotify",
  logoUrl: "https://cdn.activepieces.com/pieces/spotify.png",
  version: packageJson.version,
  authors: ['JanHolger'],
  actions,
  triggers,
});
