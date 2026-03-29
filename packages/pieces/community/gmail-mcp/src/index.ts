import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { sendEmailTool } from "./lib/tools/send-email";
import { searchEmailsTool } from "./lib/tools/search-emails";

export const gmailMcpAuth = PieceAuth.OAuth2({
  description: "OAuth2 authentication for Gmail MCP",
  authUrl: "https://accounts.google.com/o/oauth2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  required: true,
  scope: [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose"
  ],
});

export const gmailMcp = createPiece({
  displayName: "Gmail MCP",
  description: "Gmail integration for Model Context Protocol (MCP) agents",
  auth: gmailMcpAuth,
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://cdn.activepieces.com/pieces/gmail.png",
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["walidsaidi"],
  actions: [sendEmailTool, searchEmailsTool],
  triggers: [],
});
