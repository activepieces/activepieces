import { createPiece } from "@activepieces/pieces-framework";
import { actions } from "./lib/actions";
import { syconAuth } from "./lib/auth";
import { triggers } from "./lib/triggers";

/**
 * Syncon One for Activepieces: customers, companies, leads, deals, tasks, notes, tickets, meetings
 * and the live chat inbox, with instant triggers. Everything is a call to the public API, so the
 * connection's API key decides what a flow may do.
 */
export const synconOne = createPiece({
  displayName: "Syncon One",
  description:
    "CRM and live chat inbox: customers, deals, tickets, meetings and conversations, with instant triggers.",
  auth: syconAuth,
  minimumSupportedRelease: "0.30.0",
  logoUrl: "https://synconone.com/brand/app-icon-light.png",
  authors: ["rayhanm25"],
  actions,
  triggers,
});

export { syconAuth };
