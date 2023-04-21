
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { newResponse } from "./lib/triggers/new-form-response";

export const googleForms = createPiece({
  name: "google-forms",
  displayName: "Google Forms",
  logoUrl: "https://cdn.activepieces.com/pieces/google-forms.png",
  version: packageJson.version,
  authors: ["abuaboud"],
  actions: [],
  triggers: [newResponse],
});
