import { PieceAuth } from "@activepieces/pieces-framework";

export const oncehubAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Oncehub API Key",
  required: true,
  
});