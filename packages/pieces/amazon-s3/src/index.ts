
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { uploadBase64Image } from "./lib/actions/upload-image-from-base64";
import { uploadImageFromURL } from "./lib/actions/upload-image-from-url";

export const amazonS3 = createPiece({
  name: "amazon-s3",
  displayName: "S3",
  logoUrl: "https://cdn.activepieces.com/pieces/amazon-s3.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [uploadBase64Image, uploadImageFromURL],
  triggers: [],
});
