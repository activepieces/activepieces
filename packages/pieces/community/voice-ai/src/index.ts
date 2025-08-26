import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { transcribeAudio } from "./lib/actions/transcribe";

export const voiceAI = createPiece({
  displayName: "Voice-ai",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.67.0',
  logoUrl: "https://cdn.activepieces.com/pieces/voice-ai.png",
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  authors: ['amrdb'],
  actions: [transcribeAudio],
  triggers: [],
});
