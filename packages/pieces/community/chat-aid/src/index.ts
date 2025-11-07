import { createPiece } from "@activepieces/pieces-framework";
import { trainDropboxFile } from "./lib/actions/train-dropbox-file";
import { trainGoogleDriveFile } from "./lib/actions/train-google-drive-file";
import { ChatAidAuth } from "./lib/common/auth";

export const chatAid = createPiece({
  displayName: "Chat-aid",
  auth: ChatAidAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/chat-aid.png",
  authors: ['sanket-a11y'],
  actions: [
    trainDropboxFile,
    trainGoogleDriveFile
  ],
  triggers: [],
});
