
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { streamStarted } from "./lib/triggers/stream-started";

export const twitchAuth = PieceAuth.OAuth2({
  description: "Authenticate with your twitch account",
  authUrl: "https://id.twitch.tv/oauth2/authorize",
  tokenUrl: "https://id.twitch.tv/oauth2/token",
  required: true,
  scope: []
})
export const twitch = createPiece({
  displayName: "Twitch",
  auth: twitchAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/twitch.png",
  authors: [],
  actions: [],
  triggers: [streamStarted]
});

