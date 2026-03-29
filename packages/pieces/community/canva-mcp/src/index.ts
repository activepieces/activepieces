import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createDesignTool } from "./lib/tools/create-design";
import { listDesignsTool } from "./lib/tools/list-designs";
import { getDesignTool } from "./lib/tools/get-design";

export const canvaMcpAuth = PieceAuth.OAuth2({
  description: "OAuth2 authentication for Canva",
  authUrl: "https://www.canva.com/auth", // Assuming this is the auth URL, needs verification
  tokenUrl: "https://api.canva.com/v1/oauth/token", // Assuming this is the token URL, needs verification
  required: true,
  scope: ["token:read", "template:read", "design:write"], // Common scopes, needs verification
});

export const canvaMcp = createPiece({
  displayName: "Canva MCP",
  description: "Canva integration for Model Context Protocol (MCP) agents",
  auth: canvaMcpAuth,
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://cdn.activepieces.com/pieces/canva.png", // Placeholder URL, needs verification
  categories: [PieceCategory.DESIGN],
  authors: ["walidsaidi"],
  actions: [createDesignTool, listDesignsTool, getDesignTool], // Added new tools
  triggers: [],
});
