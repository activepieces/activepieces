import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const slidespeakAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Get your API key from your Slidespeak developer page.",
  required: true,

  validate: async ({ auth }) => {
    try {

      await makeRequest(auth, HttpMethod.GET, "/me");

      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});