
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { createPresentation } from "./lib/actions/create-presentation";

export const googleSlidesAuth = PieceAuth.OAuth2({
  description: "",
  
  authUrl: "https://accounts.google.com/o/oauth2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  required: true,
  scope: ["https://www.googleapis.com/auth/presentations"]
})

export const googleSlides = createPiece({
  displayName: "Google-Slides",
  auth: googleSlidesAuth,
  minimumSupportedRelease: '0.7.1',
  logoUrl: "https://cdn.activepieces.com/pieces/google-slides.png",
  authors: ['Owlcept'],
  actions: [createPresentation],
  triggers: [],
});
