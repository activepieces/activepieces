
import { createPiece } from "@activepieces/pieces-framework";
import { uploadFileFromUrl } from "./lib/actions/upload-file-from-url";
import { uploadBase64File } from "./lib/actions/upload-file-from-base64";

export const amazonS3 = createPiece({
  displayName: "Amazon S3",
  logoUrl: "https://cdn.activepieces.com/pieces/amazon-s3.png",
  minimumSupportedRelease: "0.3.12",
  authors: ["Willianwg"],
  actions: [uploadBase64File, uploadFileFromUrl],
  triggers: [],
});
