
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { newReview } from "./lib/triggers/new-review";

export const googleBusiness = createPiece({
  name: "google-business",
  displayName: "Google My Business",
  logoUrl: "https://cdn.activepieces.com/pieces/google-business.png",
  version: packageJson.version,
  authors: ["abuaboud"],
  actions: [],
  triggers: [newReview],
});
