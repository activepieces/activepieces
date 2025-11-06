import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const magicalApiAuth = PieceAuth.SecretText({
  displayName: "Magical API Key",
  description: "Enter your Magical API key from your MagicalAPI dashboard.",
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: "API Key is required.",
      };
    }

    try {

      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        "/profile-data",
        { profile_name: "activepieces_validation" }
      );

      if (response && response.data?.request_id) {
        return { valid: true };
      }

      return {
        valid: false,
        error: "Invalid API key.",
      };
    } catch (e: any) {
      return {
        valid: false,
        error: `Authentication failed: Invalid API key.`,
      };
    }
  },
});