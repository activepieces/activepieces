
import { createPiece } from "@activepieces/pieces-framework";
import { newResponse } from "./lib/triggers/new-form-response";

export const googleForms = createPiece({
  displayName: "Google Forms",
  logoUrl: "https://cdn.activepieces.com/pieces/google-forms.png",
  authors: ["abuaboud"],
  actions: [],
  triggers: [newResponse],
});
