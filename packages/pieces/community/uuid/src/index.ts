import { createPiece } from "@activepieces/pieces-framework";
import { generateUuidAction } from "./lib/actions/generate-uuid";

export const uuid = createPiece({
  displayName: "UUID",
  description: "Generate a UUID (v4)",
  auth: undefined,
  minimumSupportedRelease: "0.12.0",
  logoUrl: "https://www.svgrepo.com/show/353902/hashtag.svg",
  authors: ["lau90eth"],
  actions: [generateUuidAction],
  triggers: [],
});
