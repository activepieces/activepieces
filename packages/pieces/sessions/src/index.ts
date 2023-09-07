import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getBook } from "./lib/actions/get-page";
import { createSession } from "./lib/actions/create-session";

export const sessionAuth = PieceAuth.SecretText({
  displayName: "API Key",
  required: true,
  description: "API Key provided by Sessions.us"
});

export const sessions = createPiece({
  displayName: "Sessions",
  auth: sessionAuth,
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/sessions.png",
  authors: ["Owlcept"],
  actions: [getBook, createSession],
  triggers: [],
});