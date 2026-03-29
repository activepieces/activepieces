import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { uploadFile } from "./lib/actions/upload-file";
import { listFolder } from "./lib/actions/list-folder";

export const pcloudAuth = PieceAuth.OAuth2({
  description: "OAuth2 authentication for pCloud",
  authUrl: "https://my.pcloud.com/oauth2/authorize",
  tokenUrl: "https://api.pcloud.com/oauth2/token",
  required: true,
  scope: [],
});

export const pcloud = createPiece({
  displayName: "pCloud",
  auth: pcloudAuth,
  minimumSupportedRelease: "0.20.0",
  logoUrl: "https://cdn.activepieces.com/pieces/pcloud.png",
  authors: ["walidsaidi"],
  actions: [uploadFile, listFolder],
  triggers: [],
});
