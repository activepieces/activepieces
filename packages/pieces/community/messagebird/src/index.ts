import { createPiece, PieceCategory } from "@activepieces/pieces-framework";
import { birdAuth } from "./lib/auth";
import { birdActions } from "./lib/actions/generated";
import { customApiCall } from "./lib/actions/custom-api-call";

export const messagebird = createPiece({
  displayName: "Bird",
  description:
    "Send email, SMS and WhatsApp messages, check their status, and verify passcodes with Bird.",
  auth: birdAuth,
  minimumSupportedRelease: "0.92.0",
  logoUrl: "https://cdn.activepieces.com/pieces/messagebird.png",
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ["kishanprmr", "geekyme", "prasanna2000-max"],
  actions: [...birdActions, customApiCall],
  triggers: [],
});
