import { PieceAuth } from "@activepieces/pieces-framework";
import { baseUrl, rawGet } from "./client";

/**
 * The whole sign-in is an API key made in Settings, API. What the key may read or write is decided
 * by the API, so a key limited to one job is a good key: only a refused key (401) fails the check.
 */
export const syconAuth = PieceAuth.SecretText({
  displayName: "API key",
  description:
    "Create a key at Settings, API in Syncon One and paste it here. It starts with `sk_live_`. Give it the permissions these flows need, and nothing more.",
  required: true,
  validate: async ({ auth }) => {
    if (!/^sk_live_[A-Za-z0-9_-]{8,}$/.test(auth)) {
      return { valid: false, error: "That does not look like a Syncon One key (sk_live_…)." };
    }
    const status = await rawGet(auth, `${baseUrl()}/pipelines`);
    if (status === 401) return { valid: false, error: "Syncon One does not accept that key." };
    return { valid: true };
  },
});
