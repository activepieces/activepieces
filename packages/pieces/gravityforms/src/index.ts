
import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { gravityFormsNewSubmission } from "./lib/triggers/new-submission";

export const gravityforms = createPiece({
  displayName: "Gravity Forms",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.6.1',
  logoUrl: "https://cdn.activepieces.com/pieces/gravityforms.svg",
  authors: ['abdallah-alwarawreh'],
  actions: [],
  triggers: [gravityFormsNewSubmission],
});
