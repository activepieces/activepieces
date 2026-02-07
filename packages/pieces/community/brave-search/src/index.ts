import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { braveWebSearchAction } from "./lib/actions/web-search";

export const braveSearchAuth = PieceAuth.SecretText({
  displayName: "API Key",
  required: true,
  description: "Your Brave Search API Key (get it from https://brave.com/search/api/)",
});

export const braveSearch = createPiece({
  displayName: "Brave Search",
  description: "Privacy-preserving search engine",
  auth: braveSearchAuth,
  minimumSupportedRelease: "0.30.0",
  logoUrl: "https://cdn.activepieces.com/pieces/brave-search.png", // Placeholder
  authors: ["ErisMorn"],
  actions: [braveWebSearchAction],
  triggers: [],
});
