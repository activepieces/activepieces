import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const murfAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Enter your API key from https://murf.ai",
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: "API Key is required",
      };
    }

    try {
      const response = await makeRequest(auth as string, HttpMethod.GET, "/auth/token");

      if (response && response.token) {
        return { valid: true };
      }

      return {
        valid: false,
        error: "Invalid API key or token could not be generated",
      };
    } catch (e: any) {
      return {
        valid: false,
        error: `Auth validation failed: ${e.message}`,
      };
    }
  },
});
