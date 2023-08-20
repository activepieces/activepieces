
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createNewTask } from "./lib/actions/create-task";
export const nitfyAuth = PieceAuth.OAuth2({
  description: "",
  authUrl: "https://nifty.pm/authorize",
  tokenUrl: "https://nifty.pm/token",
  required: true,
  scope: [
    "task",
    "project"
  ],
});

export const nitfy = createPiece({
  displayName: "Nitfy",
  auth: nitfyAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/nitfy.png",
  authors: ["Salem-Alaa"],
  actions: [ createNewTask ],
  triggers: [],
});
