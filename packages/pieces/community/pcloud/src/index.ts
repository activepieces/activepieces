import { createCustomApiCallAction } from "@activepieces/pieces-common";
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { pcloudListFolder } from "./lib/actions/list-folder";
import { pcloudUploadFile } from "./lib/actions/upload-file";
import { pcloudDownloadFile } from "./lib/actions/download-file";
import { pcloudCreateFolder } from "./lib/actions/create-folder";
import { pcloudDeleteFile } from "./lib/actions/delete-file";
import { pcloudDeleteFolder } from "./lib/actions/delete-folder";
import { pcloudCopyFile } from "./lib/actions/copy-file";
import { pcloudRenameFile } from "./lib/actions/rename-file";
import { pcloudGetFileLink } from "./lib/actions/get-file-link";
import { pcloudAuth } from "./lib/auth";

export const pcloud = createPiece({
  minimumSupportedRelease: "0.30.0",
  logoUrl: "https://cdn.activepieces.com/pieces/pcloud.png",
  actions: [
    pcloudListFolder,
    pcloudUploadFile,
    pcloudDownloadFile,
    pcloudCreateFolder,
    pcloudDeleteFile,
    pcloudDeleteFolder,
    pcloudCopyFile,
    pcloudRenameFile,
    pcloudGetFileLink,
    createCustomApiCallAction({
      baseUrl: () => "https://api.pcloud.com",
      auth: pcloudAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  displayName: "pCloud",
  description: "Cloud storage and file management",
  authors: [],
  categories: [PieceCategory.CONTENT_AND_FILES],
  triggers: [],
  auth: pcloudAuth,
});
