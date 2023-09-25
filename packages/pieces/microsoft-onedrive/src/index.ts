import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { uploadFile } from "./lib/actions/upload-file";
import { listFiles } from "./lib/actions/list-files";
import { listFolders } from "./lib/actions/list-folders";
import { downloadFile } from "./lib/actions/download-file";

export const oneDriveAuth = PieceAuth.OAuth2({
  description: "Authentication for Microsoft OneDrive",
  authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  required: true,
  scope: ['Files.ReadWrite', 'offline_access'],
});


export const microsoftExcel = createPiece({
  displayName: "Microsoft OneDrive",
  auth: oneDriveAuth,
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://zapier-images.imgix.net/storage/services/e67867e9f6f5c089e243dad54467ad33.128x128.png?auto=format%2Ccompress&ixlib=python-3.0.0&q=50",
  authors: ["BastienMe"],
  actions: [uploadFile, downloadFile, listFiles, listFolders],
  triggers: [],
});
