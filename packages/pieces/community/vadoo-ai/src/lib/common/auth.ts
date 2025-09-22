import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

// The Vadoo AI API does not provide a simple "me" or "ping" endpoint to test the key.
// We will call the `get_video_url` endpoint with a dummy video ID.
// A successful call (even if it returns a 'not found' error for the video) means the key is valid.
// A 401/403 authentication error will be caught, indicating an invalid key.
export const vadooAiAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Get your API key from your Vadoo AI profile page: https://ai.vadoo.tv/profile",
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: "API Key is required.",
      };
    }
    try {
      await makeRequest(
        auth as string,
        HttpMethod.GET,
        "/get_video_url",
        undefined,
        { vid: 'activepieces_validation' }
      );
      // If the request does not throw an authorization error, we consider the key valid.
      // The API might return a 404 or a specific message for the dummy video ID,
      // but it won't be a 401/403 Unauthorized if the key is correct.
      return { valid: true };
    } catch (e: any) {
      return {
        valid: false,
        error: `Authentication failed. Please ensure your API Key is correct.`,
      };
    }
  },
});