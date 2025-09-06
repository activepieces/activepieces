import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const murfAuth = PieceAuth.CustomAuth({
  description: "Provide your Murf API Keys",
  props: {
    murfApiKey: PieceAuth.SecretText({
      displayName: "Murf API Key",
      description: "Enter your Murf API Key (used for speech, voices, etc.)",
      required: true,
    }),
    murfDubApiKey: PieceAuth.SecretText({
      displayName: "MurfDub API Key",
      description: "Enter your MurfDub API Key (used for dubbing, translation, etc.)",
      required: true,
    }),
  },
  required: true,

  // 🔎 Optional validation for both keys
  validate: async ({ auth }) => {
    if (!auth?.murfApiKey || !auth?.murfDubApiKey) {
      return { valid: false, error: "Both API keys are required" };
    }

    try {
      // Validate Murf API key by hitting /speech/voices
      await makeRequest(auth, HttpMethod.GET, "/auth/token");

     
      await makeRequest(auth, HttpMethod.GET, "murfdub/projects/list", undefined, undefined, true);

      return { valid: true };
    } catch (error: any) {
      return {
        valid: false,
        error: `Authentication failed: ${error.message || "Invalid API Keys"}`,
      };
    }
  },
});
