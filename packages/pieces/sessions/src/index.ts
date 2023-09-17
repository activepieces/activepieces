import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { getBook } from "./lib/actions/get-page";
import { createSession } from "./lib/actions/create-session";
import { getTranscript } from "./lib/actions/get-transcript";
import { getTakeaway } from "./lib/actions/get-takeaways";
import { SessionData } from "./lib/triggers/general_events.trigger";

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
  actions: [getBook, createSession, getTranscript, getTakeaway],
  triggers: [SessionData],
});