import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const ShippoAuth = PieceAuth.SecretText({
  displayName: "Shippo API Key",
  description: `**Enter your Shippo API Key (Token).**

---
### How to obtain your Shippo API key
1. Go to [Shippo Dashboard](https://apps.goshippo.com/api)
2. Log in with your account.
3. Navigate to **Settings → API**.
4. Copy either the **Test Token** (starts with \`shippo_test_\`) or **Live Token** (starts with \`shippo_live_\`).
5. Paste it here.

Your API requests will be authenticated using this key.
`,
  required: true,

 
  validate: async ({ auth }) => {
    if (auth) {
      try {

        await makeRequest(auth as string, HttpMethod.GET, "/orders/", {});
        return { valid: true };
      } catch (error) {
        return {
          valid: false,
          error: "Invalid API Key — please check your Shippo token.",
        };
      }
    }
    return { valid: false, error: "API Key is required" };
  },
});
