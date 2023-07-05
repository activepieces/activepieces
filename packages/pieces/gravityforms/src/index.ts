
import { createPiece } from "@activepieces/pieces-framework";
import { gravityFormsNewSubmission } from "./lib/triggers/new-submission";

export const gravityforms = createPiece({
  displayName: "Gravityforms",
  logoUrl: "https://cdn.activepieces.com/pieces/gravityforms.png",
  authors: ['abdallah-alwarawreh'],
  actions: [],
  triggers: [gravityFormsNewSubmission],
});
