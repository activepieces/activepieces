
import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { gravityFormsNewSubmission } from "./lib/triggers/new-submission";

export const gravityforms = createPiece({
  displayName: "Gravityforms",
  auth: PieceAuth.None(),
  logoUrl: "https://cdn.activepieces.com/pieces/gravityforms.svg",
  authors: ['abdallah-alwarawreh'],
  actions: [],
  triggers: [gravityFormsNewSubmission],
});
