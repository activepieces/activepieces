
import { createPiece } from "@activepieces/pieces-framework";
import actions from './lib/actions'
import triggers from "./lib/triggers";

export const spotify = createPiece({
  displayName: "Spotify",
  logoUrl: "https://cdn.activepieces.com/pieces/spotify.png",
  authors: ['JanHolger'],
  actions,
  triggers,
});
