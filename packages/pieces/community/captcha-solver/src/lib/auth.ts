import { PieceAuth } from "@activepieces/pieces-framework";

export const captchaSolverAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Your API key for the selected CAPTCHA solving service (2Captcha, Anti-Captcha, or CapSolver).",
  required: true,
});
