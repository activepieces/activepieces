import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createTask } from "./lib/actions/create-task";

export const nitfyAuth = PieceAuth.OAuth2({
  authUrl: "https://nifty.pm/authorize",
  tokenUrl: "https://openapi.niftypm.com/oauth/token",
  required: true,
  scope: [ "task","project","subtask","milestone","subteam"]
})

export const nitfy = createPiece({
  displayName: "Nifty",
  auth: nitfyAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/nitfy.png",
  authors: ["Salem-Alaa"],
  actions: [ createTask ],
  triggers: [],
});