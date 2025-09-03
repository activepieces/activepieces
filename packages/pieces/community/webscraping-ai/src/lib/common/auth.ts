import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const WebScrapingAuth = PieceAuth.SecretText({
  displayName: "WebScraping.AI API Key",
  description: `Enter your WebScraping.AI API Key.
---
### How to get your API key
1. Sign up or log in at [webscraping.ai](https://webscraping.ai/).
2. Go to your **Dashboard**.
3. Copy your API Key and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    if (!auth) {
      return { valid: false, error: "API Key is required" };
    }
    try {
      // Try calling account endpoint to validate key
      await makeRequest(auth as string, HttpMethod.GET, "/account");
      return { valid: true };
    } catch (e: any) {
      return { valid: false, error: "Invalid API Key" };
    }
  },
});
